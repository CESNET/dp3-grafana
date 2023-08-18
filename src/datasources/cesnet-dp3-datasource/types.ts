import { DataQuery, DataSourceJsonData } from '@grafana/data';

export enum MyQueryType {
  CurrentAttr = 'CURRENT_ATTR',
  HistoryAttr = 'HISTORY_ATTR',
  CurrentEtypeOverview = 'CURRENT_ETYPE_OVERVIEW',
  CurrentAttrOverview = 'CURRENT_ATTR_OVERVIEW',
}

export interface MyQuery extends DataQuery {
  queryType?: MyQueryType;
  etype?: string;
  attr?: string;
  eid?: string;
}

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  apiUrl?: string;
}
