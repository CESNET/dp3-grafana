import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

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
   * Returns backend full API URL with path
   * @param path Path to be prefixed with API URL prefix
   * @return     Full URL
   */
  getBackendUrl(path: string): string {
    // Prefix without trailing slash
    const prefix = this.apiUrl.replace(/\/$/, '');
    return prefix + path;
  }

  /**
   * Gets entity specification
   *
   * Contains list of entities, their attributes (with types), eid counts,...
   */
  async getEntitySpec() {
    return await getBackendSrv().get(this.getBackendUrl('/entities'))
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

    // Return a constant for each query.
    const data = options.targets.map((target) => {
      return new MutableDataFrame({
        refId: target.refId,
        fields: [
          { name: 'Time', values: [from, to], type: FieldType.time },
        ],
      });
    });

    return { data };
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
