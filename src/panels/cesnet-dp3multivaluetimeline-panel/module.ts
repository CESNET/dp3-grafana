import { PanelPlugin, FieldConfigProperty, FieldColorModeId } from '@grafana/data';
import { SimpleOptions } from './types';
import { MultiValueTimelinePanel } from './components';

export const plugin = new PanelPlugin<SimpleOptions>(MultiValueTimelinePanel)
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Min,
      FieldConfigProperty.Max,
      FieldConfigProperty.Decimals,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Thresholds,
      FieldConfigProperty.Mappings,
      FieldConfigProperty.Links,
      FieldConfigProperty.Filterable,
    ],
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
          bySeriesSupport: false,
          preferThresholdsMode: false,
        },
        defaultValue: {
          mode: FieldColorModeId.PaletteClassic,
        },
      },
    },
  });
