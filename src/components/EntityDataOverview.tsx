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
import { EIDDashboardGenerator, FullOverviewDashboardGenerator } from '../utils/dashboard-generator';

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
  const [generateFullOverviewDashboardModal, setGenerateFullOverviewDashboardModal] = useState(false);
  const [generateEIDDashboardModal, setGenerateEIDDashboardModal] = useState(false);
  const [generatedEIDDashboard, setGeneratedEIDDashboard] = useState<string>('');

  const generatedFullOverviewDashboard = new FullOverviewDashboardGenerator(entity, entitySpec, ds).generate();

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
    setGeneratedEIDDashboard(new EIDDashboardGenerator(entity, entitySpec, ds, exampleEid).generate());
  }, [ds, entity, entitySpec, data]);

  return (
    <div ref={widthProbe}>
      <Modal
        title={`Generate full overview dashboard for ${entitySpec.name}`}
        isOpen={generateFullOverviewDashboardModal}
        onDismiss={() => setGenerateFullOverviewDashboardModal(false)}
      >
        <p>Below is generated dashboard JSON model. The dashboard contains single filterable overview table.</p>
        <pre>{generatedFullOverviewDashboard}</pre>
      </Modal>
      <Modal
        title={`Generate EID dashboard for ${entitySpec.name}`}
        isOpen={generateEIDDashboardModal}
        onDismiss={() => setGenerateEIDDashboardModal(false)}
      >
        <p>Below is generated dashboard JSON model. The dashboard contains panels for all attributes - both current values and history.</p>
        <pre>{generatedEIDDashboard}</pre>
      </Modal>

      <Field label="EID filter" description="EIDs must contain this substring">
        <Input onChange={updateEidFilter} />
      </Field>
      {loading && <LoadingPlaceholder text="Loading..." />}
      {!loading && <Table
        width={width}
        height={400}
        data={data[0]}
        columnMinWidth={200}
        showTypeIcons={true}
        resizable={true}
      />}
      <div style={{ padding: '10px', width: '100%' }} />
      <HorizontalGroup spacing="lg">
        <Button icon="monitor" variant="secondary" onClick={() => setGenerateFullOverviewDashboardModal(true)}>
          Generate full overview dashboard
        </Button>
        <Button icon="monitor" variant="secondary" onClick={() => setGenerateEIDDashboardModal(true)}>
          Generate EID dashboard
        </Button>
      </HorizontalGroup>
    </div>
  );
}
