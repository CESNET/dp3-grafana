import React from 'react';
import { getDataSourceSrv , PluginPage } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';
import { PLUGIN_DATASOURCE_ID } from '../constants';
import { DataSource } from '../datasources/cesnet-dp3-datasource/datasource';
import { DataSourceOverview } from '../components/DataSourceOverview';

export function HomePage() {
  // List and instantiate all datasources
  const datasourcesSettings = getDataSourceSrv().getList({ pluginId: PLUGIN_DATASOURCE_ID });
  const datasources = datasourcesSettings.map(s => new DataSource(s));

  return (
    <PluginPage>
      <h2>Data overview</h2>
      <p>Found {datasources.length} DP³ datasource{datasources.length !== 1 && 's'}.</p>
      <p>
        <LinkButton href="connections/datasources/new">
          Add a new one
        </LinkButton>
      </p>

      <hr />

      {datasources.map((ds) => {
        return (
          <div key={ds.id}>
            <h3>{ds.name}</h3>
            <DataSourceOverview ds={ds} />
          </div>
        );
      })}
    </PluginPage>
  );
}
