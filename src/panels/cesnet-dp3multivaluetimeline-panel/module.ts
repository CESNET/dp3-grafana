import { PanelPlugin, FieldColorModeId } from '@grafana/data';
import { SimpleOptions } from './types';
import { MultiValueTimelinePanel } from './components';
import { ariaLabels } from './components/ariaLabels';

export const plugin = new PanelPlugin<SimpleOptions>(MultiValueTimelinePanel)
  .useFieldConfig({
    standardOptions: {
      color: {
        defaultValue: {
          mode: FieldColorModeId.ContinuousGrYlRd,
        },
      },
    },
    useCustomConfig: (builder) => {
      builder
        .addSliderInput({
          path: 'fillOpacity',
          name: 'Fill opacity',
          defaultValue: 25,
          settings: {
            min: 0,
            max: 100,
            step: 1,
            ariaLabelForHandle: ariaLabels.fillOpacity,
          },
        });
    }
  });
