import { PanelPlugin } from '@grafana/data';
import { MultiValueTimelinePanel } from './components';
import { SimpleOptions } from './types';

export const plugin = new PanelPlugin<SimpleOptions>(MultiValueTimelinePanel);
