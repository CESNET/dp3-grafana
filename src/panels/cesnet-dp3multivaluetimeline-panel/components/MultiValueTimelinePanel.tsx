import React from 'react';
import { Chart } from 'react-google-charts';

import { PanelProps } from '@grafana/data';
import { useTheme } from '@grafana/ui';

import { SimpleOptions } from '../types';

interface Props extends PanelProps<SimpleOptions> {}

export function MultiValueTimelinePanel({
  options,
  data,
  width,
  height,
  timeZone,
  timeRange,
  onChangeTimeRange,
  replaceVariables,
}: Props) {
  const theme = useTheme();

  // Check length of data
  if (data.series.length === 0) { 
    return (
      <div className="panel-empty">
        <p>No data</p>
      </div>
    );
  }

  if (data.series.length > 1) { 
    return (
      <div className="panel-empty">
        <p>Only one serie is allowed</p>
      </div>
    );
  }

  // Get the frame
  const frame = data.series[0];
  const correctUsageMsg = "Are you fetching multi-value observations history from DP3?";

  console.log(frame);

  // Expect 3 or 4 fields in total
  if (frame.fields.length < 3 || frame.fields.length > 4) { 
    return (
      <div className="panel-empty">
        <p>
          Expected 3 or 4 fields in total, got {frame.fields.length}.
          <br />
          {correctUsageMsg}
        </p>
      </div>
    );
  }

  const timeStartField = frame.fields[0];
  const timeEndField = frame.fields[1];
  const dataField = frame.fields[2];
  const confidenceField = frame.fields[3];

  // Expect frame fields `t`, `XXX` (and optionally `XXX#c`)
  if (timeStartField.name !== 't1' || timeEndField.name !== 't2') { 
    return (
      <div className="panel-empty">
        <p>
          First field must be named <code>t1</code>, second <code>t2</code>.
          <br />
          {correctUsageMsg}
        </p>
      </div>
    );
  }

  if (confidenceField && dataField.name + '#c' !== confidenceField.name) {
    return (
      <div className="panel-empty">
        <p>
          Expected field <code>{dataField.name}#c</code> after field
          <code>{dataField.name}</code>, got
          <code>{confidenceField.name}</code>.
          <br />
          {correctUsageMsg}
        </p>
      </div>
    );
  }

  const columns = [
    { type: 'string', id: 'Data' },
    { type: 'date', id: 'Start' },
    { type: 'date', id: 'End' },
  ];
  let rows = [];

  for (let i = 0; i < dataField.values.length; i++) {
    let v = dataField.values.get(i);

    rows.push([
      typeof(v) === 'string' ? v : v.toString(),
      new Date(timeStartField.values.get(i)),
      new Date(timeEndField.values.get(i)),
    ]);
  }

  const chartData = [columns, ...rows];
  const chartOptions = {
    alternatingRowStyle: false,
    backgroundColor: theme.colors.bg2,
    fontName: '"Inter", "Helvetica", "Arial", sans-serif',
  };

  return (
    <Chart
      chartType="Timeline"
      data={chartData}
      options={chartOptions}
      width={width}
      height={height}
    />
  );
}
