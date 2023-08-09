import React, { useEffect, useState } from 'react';
import { Card, LoadingPlaceholder } from '@grafana/ui';
import { DataSource } from '../datasources/cesnet-dp3-datasource/datasource';
import { EntityDataOverview } from './EntityDataOverview';

interface DataSourceOverviewProps {
  ds: DataSource,
};

export function DataSourceOverview({ ds }: DataSourceOverviewProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [entitiesSpec, setEntitiesSpec] = useState<Record<string, any>>({});

  // Wait for entity spec
  useEffect(() => {
    ds.getEntitySpec().then(d => {
      setEntitiesSpec(d);
      setLoading(false);
    });
  }, [ds]);

  return (
    <div>
      {loading && <LoadingPlaceholder text="Loading..." />}
      {!loading && Object.keys(entitiesSpec).map(entity => {
        const entitySpec = entitiesSpec[entity];

        return (
          <Card key={entity}>
            <Card.Heading>
              <span>{entitySpec.name} (<code>{entitySpec.id}</code>)</span>
            </Card.Heading>
            <Card.Meta>
              {[`~ ${entitySpec.eid_estimate_count} EIDs`]}
            </Card.Meta>
            <Card.Description>
              <EntityDataOverview
                ds={ds}
                entity={entity}
                entitySpec={entitySpec}
              />
            </Card.Description>
          </Card>
        );
      })}
    </div>
  );
}
