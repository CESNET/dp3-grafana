import React, { useEffect, useState, useRef } from 'react';
import { applyFieldOverrides, DataFrame } from '@grafana/data';
import { Field, Input, LoadingPlaceholder, Table, useTheme2 } from '@grafana/ui';
import { DataSource } from '../datasources/cesnet-dp3-datasource/datasource';

interface EntityDataOverviewProps {
  ds: DataSource,
  entity: string,
  entitySpec: Record<string, any>,
};

export function EntityDataOverview({
  ds,
  entity,
  entitySpec,
}: EntityDataOverviewProps) {
  const theme = useTheme2();
  const widthProbe = useRef(null);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DataFrame[]>([]);
  const [eidFilter, setEidFilter] = useState<string>('');

  // Table width update handler
  const updateWidth = () => {
    if (widthProbe.current) {
      const widthProbeAny = widthProbe.current as any;
      setWidth(widthProbeAny.offsetWidth);
    }
  };

  // EID filter update handler
  const updateEidFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEidFilter(e.target.value);
  }

  // Wait for current entity data
  useEffect(() => {
    ds.entityOverviewQuery(entity, entitySpec, eidFilter).then(d => {
      setData(applyFieldOverrides({
        data: [d],
        fieldConfig: {
          overrides: [],
          defaults: {},
        },
        theme,
        replaceVariables: (value: string) => value,
      }));
      setLoading(false);
    });
  }, [ds, entity, entitySpec, eidFilter, theme]);

  // Update width of table
  useEffect(updateWidth, [widthProbe]);

  return (
    <div ref={widthProbe}>
      <Field label="EID filter" description="EIDs must contain this substring">
        <Input onChange={updateEidFilter} />
      </Field>
      {loading && <LoadingPlaceholder text="Loading..." />}
      {!loading && <Table
        width={width}
        height={400}
        data={data[0]}
        showTypeIcons={true}
      />}
    </div>
  );
}
