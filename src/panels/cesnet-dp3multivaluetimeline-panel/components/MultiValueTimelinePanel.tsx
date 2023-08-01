import React from 'react';

import { PanelProps } from '@grafana/data';
import { FIXED_UNIT, UPlotChart, UPlotConfigBuilder, useTheme2 } from '@grafana/ui';
import { AxisPlacement, ScaleDirection, ScaleOrientation } from '@grafana/schema';

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
  const theme = useTheme2();

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

  // Expect 2 or 3 fields in total
  if (frame.fields.length < 2 || frame.fields.length > 3) { 
    return (
      <div className="panel-empty">
        <p>
          Expected 2 or 3 fields in total, got {frame.fields.length}.
          <br />
          {correctUsageMsg}
        </p>
      </div>
    );
  }

  const timeField = frame.fields[0];
  const dataField = frame.fields[1];
  const confidenceField = frame.fields[2];

  // Expect frame fields `t`, `XXX` (and optionally `XXX#c`)
  if (timeField.name !== 't') { 
    return (
      <div className="panel-empty">
        <p>
          First field must be named <code>t</code>.
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

  const builder = new UPlotConfigBuilder(timeZone);

  //const xScaleUnit = 'time';
  const xScaleKey = 'x';

  builder.addScale({
    scaleKey: xScaleKey,
    isTime: true,
    orientation: ScaleOrientation.Horizontal,
    direction: ScaleDirection.Right,
    range: [timeRange.from.valueOf(), timeRange.to.valueOf()],
  });

  // builder.addScale({
  //   scaleKey: FIXED_UNIT, // y
  //   isTime: false,
  //   orientation: ScaleOrientation.Vertical,
  //   direction: ScaleDirection.Up,
  //   //range: ...
  // });

  builder.addAxis({
    scaleKey: xScaleKey,
    isTime: true,
    //splits: false,
    placement: AxisPlacement.Bottom,
    timeZone: timeZone,
    theme,
    grid: { show: true },
  });

  // builder.addAxis({
  //   scaleKey: FIXED_UNIT, // y
  //   isTime: false,
  //   placement: AxisPlacement.Left,
  //   //splits: coreConfig.ySplits,
  //   //values: coreConfig.yValues,
  //   grid: { show: false },
  //   ticks: { show: false },
  //   gap: 16,
  //   theme,
  // });

  let distinctDataValues = [...new Set(dataField.values.toArray())];

  for (const _ of distinctDataValues) {
    builder.addSeries({
      scaleKey: FIXED_UNIT,
      theme,
    });
  }

  return (
    <UPlotChart
      width={width}
      height={height}
      data={[]}
      config={builder}
      timeRange={timeRange}
    >
    </UPlotChart>
  );
}
