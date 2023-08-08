import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { HomePage } from '../../pages';

export function App(props: AppRootProps) {
  return (
      <Switch>
        <Route component={HomePage} />
      </Switch>
  );
}
