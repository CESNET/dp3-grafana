import React, { useEffect, useState, useRef } from 'react';
import { applyFieldOverrides, DataFrame } from '@grafana/data';
import {
  Button,
  Field,
  HorizontalGroup,
  Input,
  LoadingPlaceholder,
  Modal,
  Table,
  useTheme2
} from '@grafana/ui';
import { DataSource } from '../datasources/cesnet-dp3-datasource/datasource';
import { DashboardGenerator } from '../utils/dashboard-generator';

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
  const [generateDashboardModal, setGenerateDashboardModal] = useState(false);
  const [data, setData] = useState<DataFrame[]>([]);
  const [eidFilter, setEidFilter] = useState<string>('');
  const [generatedDashboard, setGeneratedDashboard] = useState<string>('');

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

  useEffect(() => {
    const exampleEid = data.length > 0 && data[0].fields.length > 0 && data[0].fields[0].values.length > 0
                         ? data[0].fields[0].values.get(0)
                         : '';
    setGeneratedDashboard(new DashboardGenerator(entity, entitySpec, ds, exampleEid).generate());
  }, [ds, entity, entitySpec, data]);

  return (
    <div ref={widthProbe}>
      <Modal
        title={`Generate dashboard for ${entitySpec.name}`}
        isOpen={generateDashboardModal}
        onDismiss={() => setGenerateDashboardModal(false)}
      >
        <p>Below is generated dashboard JSON model.</p>
        <pre>{generatedDashboard}</pre>
      </Modal>

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
      <div style={{ padding: '10px', width: '100%' }} />
      <HorizontalGroup spacing="lg">
        <Button icon="monitor" variant="secondary" onClick={() => setGenerateDashboardModal(true)}>
          Generate dashboard
        </Button>
      </HorizontalGroup>
    </div>
  );
}
