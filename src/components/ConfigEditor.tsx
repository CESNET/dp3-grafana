import React, { ChangeEvent } from 'react';
import { Field, Input } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;

  const onAPIUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      apiUrl: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const { jsonData } = options;

  return (
    <div className="gf-form-group">
      <Field
        label="API URL"
        description="Must be accessible from user's browser."
        invalid={jsonData.apiUrl === ''}
        error={jsonData.apiUrl === '' ? 'This input is required' : ''}
      >
        <Input
          value={jsonData.apiUrl || ''}
          placeholder="https://dp3.cesnet.cz/path"
          onChange={onAPIUrlChange}
        />
      </Field>
    </div>
  );
}
