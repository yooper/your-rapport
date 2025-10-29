import React, { useState, useEffect, Fragment } from 'react';
import FormControl from '@mui/material/FormControl';
import {
  StyledTextField,
  StyledTextFieldNoWidth,
} from '../../inputs/StyledTextField';

import IconButton from '@mui/material/IconButton';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { DeleteForever, InfoOutlined } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import HelperPopover from '../../HelperPopover';
import { Tooltip } from '@mui/material';
import { ApiKey, DiscoveryPluginFormProps } from '../../../types';
import { createTab} from '../../../utilities/loaders';

const FieldMappingForm: React.FC<DiscoveryPluginFormProps> = ({
  record,
  setRecord,
  apiKeys
}) => {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setRows(toRows());

      setIsLoading(false);
    }

    fetchData();
  }, []);

  const staticFieldMappings = [
    '{{mhtml}}',
    '{{hash}}',
    '{{hashAlgorithm}}',
    '{{note}}',
    '{{referrer}}',
    '{{relevance}}',
    '{{screenShot}}',
    '{{url}}',
    '{{domain}}',
    '{{selectorValue}}',
    '{{uuid}}'
  ];

  const getFieldMappings = (): string[] => {
    const apiKeyNames = apiKeys.map((apiKey: ApiKey) => `{{${apiKey.key}}}`);
    const mappings = [...staticFieldMappings, ...apiKeyNames];
    return mappings;
  };

  const addRow = () => {
    setRows([...rows, {}]);
  };

  const deleteRow = (index: number) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);

    if (updatedRows.length === 0) {
      setRecord((prev) => ({ ...prev, fieldMapping: {} }));
    } else {
      setRecord((prev) => ({ ...prev, fieldMapping: toObj(updatedRows) }));
    }
  };

  const handleFieldNameChange = (index: number, value: string) => {
    const updated = [...rows];
    updated[index].keyName = value;
    setRows(updated);
    setRecord((prev) => ({ ...prev, fieldMapping: toObj(updated) }));
  };

  const handleFieldValueChange = (index: number, value: string) => {
    const updated = [...rows];
    updated[index].mappedFieldName = value;
    setRows(updated);
    setRecord((prev) => ({ ...prev, fieldMapping: toObj(updated) }));
  };

  const toObj = (rows: Record<string, any>[]): Record<string, string> => {
    return Object.assign(
      {},
      ...rows.map((row) => ({
        [row.keyName ?? '']: row.mappedFieldName ?? '',
      }))
    );
  };

  const toRows = (): Record<string, any>[] => {
    const mapping = record.fieldMapping ?? {};
    return Object.entries(mapping).map(([key, value]) => ({
      keyName: key,
      mappedFieldName: value,
    }));
  };

  if (isLoading) {
    return <div></div>;
  }

  return (
    <Fragment>
      <Tooltip
        title={
          'To learn more about field mapping your data click to be sent to our wiki docs.'
        }
      >
        <IconButton onClick={() => { createTab('https://github.com/yooper/your-rapport/wiki/Discovery-Plugins-Tutorial'); }}>
          <InfoOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={
          'Field mappings provide the ability to map outgoing data fields.'
        }
      >
       <IconButton onClick={addRow}>
          <AddBoxIcon />
          Add Field Mapping(s)
        </IconButton>
      </Tooltip>

      {rows.map((row, index) => (
        <div>
          <FormControl>
            <StyledTextFieldNoWidth
              sx={{ m: 0.75, width: 500 }}
              variant="outlined"
              name="keyName"
              id="keyName"
              label="Field Name"
              value={row.keyName ?? ''}
              inputProps={{ 'aria-label': 'controlled' }}
              onChange={(event) =>
                handleFieldNameChange(index, event.target.value)
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <HelperPopover message="The key name is static, it is the field name of the value you want to map to." />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
          <FormControl>
            <Autocomplete
              sx={{ m: 0.75, width: 500 }}
              freeSolo
              options={getFieldMappings()}
              value={row.mappedFieldName ?? ''}
              onInputChange={(_, value) => handleFieldValueChange(index, value)}
              renderInput={(params) => (
                <StyledTextFieldNoWidth {...params} label="Field Value" />
              )}
            />
          </FormControl>
          <FormControl>
            <IconButton onClick={() => deleteRow(index)}>
              <DeleteForever />
            </IconButton>
          </FormControl>
        </div>
      ))}
    </Fragment>
  );
};

export default FieldMappingForm;
