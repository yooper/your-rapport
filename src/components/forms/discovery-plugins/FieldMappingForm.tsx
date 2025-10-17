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

const FieldMappingForm: React.FC<FieldMappingFormProps> = ({
  record,
  setRecord,
}) => {
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Placeholder for actual API fetch
        setApiKeys([]); // Could be replaced with real logic later
      } catch (err) {
        console.error('Fetch failed for api keys endpoint');
        setApiKeys([]);
      } finally {
        setIsLoading(false);
      }
      setRows(toRows());
    }

    fetchData();
  }, []);

  const staticFieldMappings = [
    '{{data}}',
    '{{hash}}',
    '{{hashAlgorithm}}',
    '{{note}}',
    '{{referrer}}',
    '{{relevance}}',
    '{{screenShot}}',
    '{{url}}',
    '{{domain}}',
    '{{selectorValue}}',
  ];

  const getFieldMappings = (): string[] => {
    const apiKeyNames = apiKeys.map((apiKey) => `{${apiKey.key}}`);
    const mappings = [...staticFieldMappings, ...apiKeyNames];
    return mappings.sort();
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

  const toObj = (rows: FieldRow[]): Record<string, string> => {
    return Object.assign(
      {},
      ...rows.map((row) => ({
        [row.keyName ?? '']: row.mappedFieldName ?? '',
      }))
    );
  };

  const toRows = (): FieldRow[] => {
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
        <IconButton onClick={addRow}>
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
              sx={{ m: 0.75, width: 400 }}
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
              sx={{ m: 0.75, width: 400 }}
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
