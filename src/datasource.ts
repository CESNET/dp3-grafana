import {
  DataQueryRequest,
  DataQueryResponse,
  DataQueryResponseData,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

/**
 * DP3 AttrType enum
 */
// enum AttrType {
//   Plain = 1,
//   Observation = 2,
//   Timeseries = 3,
// }

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
   * Converts attribute data type to Grafana's `FieldType`
   * @param  attrSpec Attribute specification
   * @return          Grafana field type
   */
  private getFieldTypeFromAttrSpec(attrSpec: Record<string, any>): FieldType {
    // TODO
    return FieldType.string;
  }

  /**
   * Prepares single query field (columns) for given query
   * @param  frame    Frame to mutate
   * @param  query    Query
   * @param  attrSpec Spec of given attribute
   */
  private addQueryFieldToFrame(frame: MutableDataFrame, query: MyQuery, attrSpec: Record<string, any>) {
    frame.addField({
      name: attrSpec.id,
      type: this.getFieldTypeFromAttrSpec(attrSpec),
      config: {
        displayNameFromDS: attrSpec.name,
        description: attrSpec.description,
      }
    });
  }

  /**
   * Prepares query fields (columns) for given query
   * @param  frame          Frame to mutate
   * @param  query          Query
   * @param  attributesSpec Attributes spec of entity
   */
  private addQueryFieldsToFrame(frame: MutableDataFrame, query: MyQuery, attributesSpec: Record<string, any>) {
    // Add single attribute
    if (query.attr && attributesSpec[query.attr]) {
      this.addQueryFieldToFrame(frame, query, attributesSpec[query.attr]);
      return;
    }

    // Add all attributes
    for (const attr in attributesSpec) {
      this.addQueryFieldToFrame(frame, query, attributesSpec[attr]);
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
      fields: [
        {
          name: 'eid',
          type: FieldType.string,
          config: { displayNameFromDS: 'EID' }
        }
      ]
    });

    // Populate fields
    this.addQueryFieldsToFrame(frame, query, entitySpec.attribs);

    const { data } = await this.doDatasourceRequest(
      `/entity/${query.entity}`,
      { limit: 9999 },
    );

    for (const d of data.data) {
      frame.add(d);
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
          name: '_time_created',
          type: FieldType.time,
          config: { displayNameFromDS: 'Time' }
        }
      ]
    });

    // Populate fields
    this.addQueryFieldsToFrame(frame, query, entitySpec.attribs);

    // Eid and attribute must be populated
    // TODO: allow multiple EIDs
    if (!query.eid || !query.attr) {
      return [];
    }

    const { data } = await this.doDatasourceRequest(
      `/entity/${query.entity}/${query.eid}`,
      { date_from: from, date_to: to }
    );

    for (const snapshot of data.snapshots) {
      frame.add(snapshot);
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

    if (query.currentValues) {
      return this.processCurrentValuesQuery(from, to, query, entitySpec);
    } else {
      return this.processHistoryQuery(from, to, query, entitySpec);
    }
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
      target => this.processSingleQuery(from, to, target, entitiesSpec)
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
