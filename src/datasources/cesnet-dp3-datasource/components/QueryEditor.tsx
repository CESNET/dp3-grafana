import React, { ChangeEvent, useEffect, useState } from 'react';
import { InlineField, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';

import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery, MyQueryType } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const { queryType, etype, eid, attr } = query;

  const queryTypes = [
    {
      value: MyQueryType.CurrentAttr,
      label: 'Current value of attribute',
      description: 'Gives current value of entity ID\'s attribute (only for plain and observations attribute types).'
    },
    {
      value: MyQueryType.HistoryAttr,
      label: 'History of attribute',
      description: 'Gives history of entity ID\'s attribute (only for observations and timeseries attribute types).'
    },
    {
      value: MyQueryType.CurrentEtypeOverview,
      label: 'Current overview of entity type',
      description: 'Gives current values for all attributes of given entity type.'
    },
    {
      value: MyQueryType.CurrentAttrOverview,
      label: 'Current overview of attribute',
      description: 'Gives current value of attribute for each entity ID.'
    },
  ];

  const [entitySpec, setEntitySpec] = useState<any>({});
  const [etypes, setEtypes] = useState<Array<SelectableValue<string>>>([]);
  const [attributes, setAttributes] = useState<Array<SelectableValue<string>>>([]);
  const [attrState, setAttrState] = useState<string | null>(attr || null);

  // Load entity spec (async)
  useEffect(() => {
    datasource.getEntitySpec().then(resp => {
      setEntitySpec(resp);

      setEtypes(Object.keys(resp).map(key => {
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
    const attrs = entitySpec[etype || '']?.attribs || {};

    const newAttributes = Object.keys(attrs).filter(key => {
      if (queryType === MyQueryType.HistoryAttr) {
        // Only observations and timeseries have history
        return DataSource.attrHasHistory(attrs[key]);
      } else {
        // Only plain and observations have current value
        return DataSource.attrHasCurrentValue(attrs[key]);
      }
    }).map(key => {
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
  }, [queryType, entitySpec, etype]);  // eslint-disable-line react-hooks/exhaustive-deps

  // On change hooks
  const onQueryTypeChange = (value: SelectableValue<string>) => {
    onChange({ ...query, queryType: value.value as MyQueryType });
    onRunQuery();
  };

  const onEtypeChange = (value: SelectableValue<string>) => {
    delete query.attr;
    onChange({ ...query, etype: value.value });
    onRunQuery();
  };

  const onAttrChange = (value: SelectableValue<string>) => {
    setAttrState(value.value || null);
    onChange({ ...query, attr: value.value });
    onRunQuery();
  };

  const onEidChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, eid: event.target.value });
    onRunQuery();
  };

  return (
    <div>
      <div className="gf-form gf-form-inline">
        <InlineField label="Query type">
          <Select
            options={queryTypes}
            value={queryType}
            onChange={onQueryTypeChange}
          />
        </InlineField>
      </div>
      <div className="gf-form gf-form-inline">
        <InlineField label="Entity type">
          <Select
            options={etypes}
            value={etype}
            onChange={onEtypeChange}
            isLoading={etypes.length === 0}
            disabled={etypes.length === 0}
          />
        </InlineField>

        {(queryType === MyQueryType.CurrentAttr ||
          queryType === MyQueryType.HistoryAttr ||
          queryType === MyQueryType.CurrentAttrOverview) &&
        <InlineField label="Attribute">
          <Select
            options={attributes}
            value={attrState}
            onChange={onAttrChange}
            isLoading={etypes.length === 0}
            disabled={attributes.length === 0}
          />
        </InlineField>
        }

        {(queryType === MyQueryType.CurrentAttr ||
          queryType === MyQueryType.HistoryAttr) &&
        <InlineField label="Entity ID">
          <Input onChange={onEidChange} value={eid || ''} />
        </InlineField>
        }
      </div>
    </div>
  );
}
