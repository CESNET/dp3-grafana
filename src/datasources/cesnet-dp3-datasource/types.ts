import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  currentValues?: boolean;
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
