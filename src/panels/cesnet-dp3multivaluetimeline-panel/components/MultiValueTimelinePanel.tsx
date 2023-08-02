import React from 'react';
import * as d3 from 'd3';

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

  // Expect frame fields `t1`, `t2`, `XXX` (and optionally `XXX#c`)
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

  const distinctValues = [ ...new Set(dataField.values.toArray()) ].sort();
  const maxLenghtOfValue = Math.max(0, ...distinctValues.map(v => v.toString().length));

  // Convert values of all fields to objects
  let values = [];
  for (let i = 0; i < dataField.values.length; i++) {
    let v = {
      t1: timeStartField.values.get(i),
      t2: timeEndField.values.get(i),
      v: dataField.values.get(i),
      c: 1.0
    };

    if (confidenceField) {
      v.c = confidenceField.values.get(i);
    }

    values.push(v);
  }

  // Chart
  const marginTop = 0;
  const marginRight = 10;
  const marginBottom = 20;
  const marginLeft = 10 + 8 * maxLenghtOfValue;  // approximated

  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  const xScale = d3.scaleTime(
    [timeRange.from.valueOf(), timeRange.to.valueOf()],
    [0, chartWidth]
  );
  const yScale = d3.scaleBand(distinctValues, [0, chartHeight]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  return (
    <svg width={width} height={height}>
      <g>
        {values.map((v, i) => (
          <rect
            x={marginLeft + xScale(v.t1)}
            y={marginTop + (yScale(v.v) || 0)}
            width={xScale(v.t2) - xScale(v.t1) || 10}
            height={yScale.bandwidth()}
            fill={theme.palette.greenBase}
            opacity={v.c}
            key={i}
          />
        ))}
      </g>
      <g
        transform={`translate(${marginLeft}, ${marginTop + chartHeight})`}
        ref={(node) => {
          d3.select(node).call(xAxis as any);
        }}
      />
      <g
        transform={`translate(${marginLeft}, ${marginTop})`}
        ref={(node) => {
          d3.select(node).call(yAxis as any);
        }}
      />
    </svg>
  );
}
