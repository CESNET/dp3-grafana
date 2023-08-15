import {
  DataQueryRequest,
  DataQueryResponse,
  DataQueryResponseData,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  ScopedVars,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

/**
 * DP3 AttrType enum
 */
export enum AttrType {
  PLAIN = 1,
  OBSERVATION = 2,
  TIMESERIES = 4,
}

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  // DP3's API URL
  private apiUrl: string;

  /**
   * Constructs DataSource object
   * @param instanceSettings Settings
   */
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.apiUrl = instanceSettings.jsonData.apiUrl || '';
  }

  /**
   * Gets entity specification
   *
   * Contains list of entities, their attributes (with types), eid counts,...
   */
  async getEntitySpec() {
    return await getBackendSrv().get(this.getBackendUrl('/entities'));
  }

  /**
   * Returns backend full API URL with path
   * @param path Path to be prefixed with API URL prefix
   * @return     Full URL
   */
  private getBackendUrl(path: string): string {
    // Prefix without trailing slash
    const prefix = this.apiUrl.replace(/\/$/, '');
    return prefix + path;
  }

  /**
   * Does datasource GET request to specified path with parameters
   * @param  path   URL path
   * @param  params Query parameters
   * @return        Received data
   */
  private async doDatasourceRequest(path: string, params: Record<string, any> = {}) {
    return await getBackendSrv().datasourceRequest({
      method: 'GET',
      url: this.getBackendUrl(path),
      params: params
    });
  }

  /**
   * Converts DP3's `DataType` to Grafana's `FieldType`
   * @param  dataType Data type
   * @return          Grafana field type
   */
  private getFIeldTypeFromDataType(dataType: string): FieldType {
    switch (dataType) {
    case 'tag': return FieldType.boolean;
    case 'binary': return FieldType.boolean;
    case 'string': return FieldType.string;
    case 'int': return FieldType.number;
    case 'int64': return FieldType.number;
    case 'float': return FieldType.number;
    case 'ipv4': return FieldType.string;
    case 'ipv6': return FieldType.string;
    case 'mac': return FieldType.string;
    case 'time': return FieldType.time;
    case 'special': return FieldType.other;
    case 'json': return FieldType.string;
    }

    const firstPart = dataType.split('<')[0];

    switch (firstPart) {
    case 'link': return FieldType.string;
    case 'array': return FieldType.other;
    case 'set': return FieldType.other;
    case 'dict': return FieldType.other;
    case 'category': return FieldType.string;
    default: return FieldType.other;
    }
  }

  /**
   * Checks whether attribute has current value
   * @param attrSpec Attribute spec
   */
  static attrHasCurrentValue(attrSpec: Record<string, any>) {
    return attrSpec.t === AttrType.PLAIN || attrSpec.t === AttrType.OBSERVATION;
  }

  /**
   * Checks whether attribute has history
   * @param attrSpec Attribute spec
   */
  static attrHasHistory(attrSpec: Record<string, any>) {
    return attrSpec.t === AttrType.OBSERVATION || attrSpec.t === AttrType.TIMESERIES;
  }

  /**
   * Prepares single query field (column) for given query and attribute type
   * @param  frame         Frame to mutate
   * @param  attrSpec      Attribute spec
   * @param  currentValues Whether querying current values
   */
  private addQueryFieldToFrameByAttrType(frame: MutableDataFrame, attrSpec: Record<string, any>, currentValues: boolean) {
    switch (attrSpec.t) {
    case AttrType.PLAIN:
      frame.addField({
        name: attrSpec.id,
        type: this.getFIeldTypeFromDataType(attrSpec.data_type),
        config: {
          displayNameFromDS: attrSpec.name,
          description: attrSpec.description,
        }
      });
      break;
    case AttrType.OBSERVATION:
      frame.addField({
        name: attrSpec.id,
        type: attrSpec.multi_value
          ? FieldType.other
          : this.getFIeldTypeFromDataType(attrSpec.data_type),
        config: {
          displayNameFromDS: attrSpec.name,
          description: attrSpec.description,
        }
      });

      if (attrSpec.confidence && !currentValues) {
        // Current values don't include confidence
        frame.addField({
          name: `${attrSpec.id}#c`,
          type: attrSpec.multi_value ? FieldType.other : FieldType.number,
          config: attrSpec.multi_value
            ? {
              displayNameFromDS: `${attrSpec.name} - confidence`,
            }
            : {
              displayNameFromDS: `${attrSpec.name} - confidence`,
              unit: 'percentunit',
              min: 0,
              max: 1
            }
        });
      }
      break;
    case AttrType.TIMESERIES:
      for (const s in attrSpec.series) {
        frame.addField({
          name: `${attrSpec.id}/${s}`,
          type: this.getFIeldTypeFromDataType(attrSpec.series[s].data_type),
          config: {
            displayNameFromDS: `${attrSpec.name}/${s}`,
          }
        });
      }
      break;
    default:
      console.warn(`DP3: Unknown attribute type: ${attrSpec.t}`);
    }
  }

  /**
   * Processes single current values query
   * @param  from       Timestamp from
   * @param  to         Timestamp to
   * @param  query      Query
   * @param  entitySpec Entity specification
   * @return            Data frames
   */
  private async processCurrentValuesQuery(from: number, to: number, query: MyQuery, entitySpec: Record<string, any>): Promise<MutableDataFrame[]> {
    const frame = new MutableDataFrame({
      refId: query.refId,
      fields: []
    });

    // Add eid field if eid is not directly set
    if (!query.eid) {
      frame.addField({
        name: 'eid',
        type: FieldType.string,
        config: { displayNameFromDS: 'EID' }
      });
    }

    const attr = query.attr || '';
    const attrSpec = entitySpec.attribs[attr];

    // Populate fields
    this.addQueryFieldToFrameByAttrType(frame, attrSpec, true);

    if (query.eid) {
      // Get data for given eid
      const { data } = await this.doDatasourceRequest(
        `/entity/${query.entity}/${query.eid}/get/${attr}`,
        { date_from: to, date_to: to },
      );

      const currentValueObj: Record<string, any> = {};
      currentValueObj[attr] = data.current_value;

      if (data.current_value) {
        frame.add(currentValueObj);
      }
    } else {
      // Get data for all eids
      const { data } = await this.doDatasourceRequest(
        `/entity/${query.entity}`,
        { limit: 9999 },
      );

      for (const d of data.data) {
        frame.add(d);
      }
    }

    return [frame];
  }

  /**
   * Processes single history query
   * @param  from       Timestamp from
   * @param  to         Timestamp to
   * @param  query      Query
   * @param  entitySpec Entities specification
   * @return            Data frames
   */
  private async processHistoryQuery(from: number, to: number, query: MyQuery, entitySpec: Record<string, any>): Promise<MutableDataFrame[]> {
    const frame = new MutableDataFrame({
      refId: query.refId,
      fields: [
        {
          name: 't1',
          type: FieldType.time,
          config: { displayNameFromDS: 'Time (start)' }
        },
        {
          name: 't2',
          type: FieldType.time,
          config: { displayNameFromDS: 'Time (end)' }
        }
      ]
    });

    const attr = query.attr || '';
    const eid = query.eid || '';
    const attrSpec = entitySpec.attribs[attr];

    // Populate fields
    this.addQueryFieldToFrameByAttrType(frame, attrSpec, false);

    // Eid must be populated
    // TODO: allow multiple EIDs
    if (!eid) {
      return [];
    }

    const { data } = await this.doDatasourceRequest(
      `/entity/${query.entity}/${eid}/get/${attr}`,
      { date_from: from, date_to: to }
    );

    for (const d of data.history) {
      const dExp: Record<string, any> = {
        t1: Date.parse(d.t1 + 'Z'),
        t2: Date.parse(d.t2 + 'Z'),
      };

      if (attrSpec.t === AttrType.TIMESERIES) {
        // Extract series
        for (const series in d.v) {
          dExp[`${attr}/${series}`] = d.v[series];
        }
      } else {
        // Use value directly
        dExp[attr] = d.v;
        dExp[`${attr}#c`] = d.c;
      }

      frame.add(dExp);
    }

    return [frame];
  }

  /**
   * Processes single query
   * @param  from         Timestamp from
   * @param  to           Timestamp to
   * @param  query        Query
   * @param  entitiesSpec Entities specification
   * @return              Data frames
   */
  private async processSingleQuery(from: number, to: number, query: MyQuery, entitiesSpec: Record<string, any>): Promise<MutableDataFrame[]> {
    const entitySpec = entitiesSpec[query.entity || ''];

    // Entity must be present and valid
    if (!query.entity || !entitySpec) {
      return [];
    }

    // Attribute must be present and valid
    if (!query.attr || !entitySpec.attribs[query.attr]) {
      return [];
    }

    if (query.currentValues) {
      return this.processCurrentValuesQuery(from, to, query, entitySpec);
    } else {
      return this.processHistoryQuery(from, to, query, entitySpec);
    }
  }

  /**
   * Interpolates variables in given query
   * @param  query Query
   * @param  vars  User's variables
   * @return       Query for further processing
   */
  private replaceInterpolateVariablesInQuery(query: MyQuery, vars: ScopedVars): MyQuery {
    const templateSrv = getTemplateSrv();

    const interpolated = {
      entity: templateSrv.replace(query.entity, vars),
      attr: templateSrv.replace(query.attr, vars),
      eid: templateSrv.replace(query.eid, vars),
    };

    return { ...query, ...interpolated };
  }

  /**
   * Gets all current values of entity attributes
   * @param  entity     Entity
   * @param  entitySpec Entity spec
   * @param  eidFilter  Return only EIDs containing this substring
   * @return            Data frame
   */
  async entityOverviewQuery(entity: string, entitySpec: Record<string, any>, eidFilter = ''): Promise<MutableDataFrame> {
    const frame = new MutableDataFrame({
      fields: []
    });

    // Add eid field
    frame.addField({
      name: 'eid',
      type: FieldType.string,
      config: { displayNameFromDS: 'EID' }
    });

    // Add fields for all attributes
    for (const attr in entitySpec.attribs) {
      const attrSpec = entitySpec.attribs[attr];

      // Use only fields with current values
      if (DataSource.attrHasCurrentValue(attrSpec)) {
        this.addQueryFieldToFrameByAttrType(frame, attrSpec, true);
      }
    }

    // Get data for all eids
    const { data } = await this.doDatasourceRequest(
      `/entity/${entity}`,
      { limit: 10, eid_filter: eidFilter },
    );

    // Add data
    for (const d of data.data) {
      frame.add(d);
    }

    return frame;
  }

  /**
   * Queries DP3's API for data
   * @param  options Query options
   * @return         Data
   */
  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Get current entity spec
    const entitiesSpec = await this.getEntitySpec();

    // Return a constant for each query.
    const dataPromises = options.targets.map(
      target => this.processSingleQuery(
        from,
        to,
        this.replaceInterpolateVariablesInQuery(target, options.scopedVars),
        entitiesSpec
      )
    );

    // Concatenate all arrays when all data is ready
    return Promise.all(dataPromises).then(data => {
      let resp: DataQueryResponseData[] = [];

      for (const d of data) {
        resp = resp.concat(d);
      }

      return { data: resp };
    });
  }

  /**
   * Health-checks DP3's API
   */
  async testDatasource() {
    const successMsg = 'It works!';

    // Health check
    const result = await getBackendSrv().get(this.getBackendUrl('/'));
    const success = result.detail === successMsg;

    if (success) {
      return { status: 'success', message: successMsg };
    }

    return {
      status: 'error',
      message: `Unexpected body: ${JSON.stringify(result)}`,
    };
  }
}
