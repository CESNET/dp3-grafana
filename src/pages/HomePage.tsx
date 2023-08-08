import React from 'react';
import { PluginPage } from '@grafana/runtime';
// import { prefixRoute } from '../utils/utils.routing';

export function HomePage() {
  return (
    <PluginPage>
      <div>
        This is page one.
      </div>
    </PluginPage>
  );
}
