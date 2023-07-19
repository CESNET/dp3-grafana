import React, { ChangeEvent, useEffect, useState } from 'react';
import { Checkbox, InlineField, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';

import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const { currentValues, entity, eid, attr } = query;

  const [entitySpec, setEntitySpec] = useState<any>({});
  const [entities, setEntities] = useState<Array<SelectableValue<string>>>([]);
  const [attributes, setAttributes] = useState<Array<SelectableValue<string>>>([]);
  const [attrState, setAttrState] = useState<string | null>(attr || null);

  // Load entity spec (async)
  useEffect(() => {
    datasource.getEntitySpec().then(resp => {
      setEntitySpec(resp);

      setEntities(Object.keys(resp).map(key => {
        const spec = resp[key];
        return {
          value: key,
          label: `${spec.name} (${key})`,
          description: `~ ${spec.eid_estimate_count} EIDs`
        }
      }));
    });
  }, [datasource]);

  // Reflect entity's attributes
  useEffect(() => {
    const attrs = entitySpec[entity || '']?.attribs || {};

    const newAttributes = Object.keys(attrs).map(key => {
      return {
        value: key,
        label: `${attrs[key].name} (${key})`,
        description: attrs[key].description
      }
    });

    setAttributes(newAttributes);

    // Reset attribute <select> if not present in new attributes list
    if (newAttributes.length > 0 &&
        !newAttributes.some(a => a.value === attrState)) {
      setAttrState(null);
    }
  }, [entitySpec, entity]);  // eslint-disable-line react-hooks/exhaustive-deps

  // On change hooks
  const onCurrentValuesChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, currentValues: event.target.checked });
    onRunQuery();
  };

  const onEntityChange = (value: SelectableValue<string>) => {
    delete query.attr;
    onChange({ ...query, entity: value.value });
    onRunQuery();
  };

  const onEidChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, eid: event.target.value });
    onRunQuery();
  };

  const onAttrChange = (value: SelectableValue<string>) => {
    setAttrState(value.value || null);
    onChange({ ...query, attr: value.value });
    onRunQuery();
  };

  return (
    <div className="gf-form gf-form-inline">
      <InlineField
        label="Current values"
        tooltip="If checked, show only master record data or latest snapshot
          (depends on other fields). If unchecked, shows historic data.
          This is handy for tabular overviews."
      >
        <Checkbox value={currentValues} onChange={onCurrentValuesChange} />
      </InlineField>
      <InlineField label="Entity" required>
        <Select
          options={entities}
          value={entity}
          onChange={onEntityChange}
          isLoading={entities.length === 0}
          disabled={entities.length === 0}
        />
      </InlineField>
      <InlineField label="Entity ID">
        <Input onChange={onEidChange} value={eid || ''} />
      </InlineField>
      <InlineField label="Attribute">
        <Select
          options={attributes}
          value={attrState}
          onChange={onAttrChange}
          isLoading={entities.length === 0}
          disabled={attributes.length === 0}
        />
      </InlineField>
    </div>
  );
}
