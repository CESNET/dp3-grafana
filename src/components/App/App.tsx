import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { HomePage, DataSourceOverviewPage } from '../../pages';
import { prefixRoute } from '../../utils/utils.routing';

export function App(props: AppRootProps) {
  return (
      <Switch>
        <Route exact path={prefixRoute('ds-overview/:id')} component={DataSourceOverviewPage} />
        <Route component={HomePage} />
      </Switch>
  );
}
