import React from 'react';
import { PanelProps } from '@grafana/data';
import { TimeSeries, TooltipPlugin, TooltipDisplayMode, ZoomPlugin } from '@grafana/ui';
import { LegendDisplayMode, VizLegendOptions } from '@grafana/schema';

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
  // Hide legend
  const legendConfig: VizLegendOptions = {
    calcs: [],
    displayMode: LegendDisplayMode.Hidden,
    placement: 'bottom',
    showLegend: false
  };

  return (
    <div>
      <TimeSeries
        width={width}
        height={height}
        timeRange={timeRange}
        timeZone={timeZone}
        frames={data.series}
        legend={legendConfig}
      >
        {(config, alignedDataFrame) => {
          return (
            <>
              <TooltipPlugin
                config={config}
                data={alignedDataFrame}
                mode={TooltipDisplayMode.Multi}
                timeZone={timeZone}
              />
              <ZoomPlugin config={config} onZoom={onChangeTimeRange} />
            </>
          );
        }}
      </TimeSeries>
    </div>
  );
}
