import React from 'react';
import { useParams } from 'react-router-dom';
import { PluginPage } from '@grafana/runtime';
// import { prefixRoute } from '../utils/utils.routing';

export function DataSourceOverviewPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PluginPage>
      <div>
        Overview of {id}
      </div>
    </PluginPage>
  );
}
