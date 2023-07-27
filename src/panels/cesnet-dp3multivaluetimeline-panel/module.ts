import { PanelPlugin, FieldColorModeId } from '@grafana/data';
import { GraphGradientMode } from '@grafana/schema';
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
        .addRadio({
          path: 'gradientMode',
          name: 'Gradient mode',
          defaultValue: GraphGradientMode.Scheme,
          settings: {
            options: [
              {
                label: 'None',
                value: GraphGradientMode.None,
                ariaLabel: ariaLabels.gradientNone,
              },
              {
                label: 'Opacity',
                value: GraphGradientMode.Opacity,
                description: 'Enable fill opacity gradient',
                ariaLabel: ariaLabels.gradientOpacity,
              },
              {
                label: 'Hue',
                value: GraphGradientMode.Hue,
                description: 'Small color hue gradient',
                ariaLabel: ariaLabels.gradientHue,
              },
              {
                label: 'Scheme',
                value: GraphGradientMode.Scheme,
                description: 'Use color scheme to define gradient',
                ariaLabel: ariaLabels.gradientScheme,
              },
            ],
          },
        })
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
