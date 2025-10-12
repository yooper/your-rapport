import React, { useState, useEffect, Fragment } from 'react';
import FormControl from '@mui/material/FormControl';
import { StyledTextField } from '../../inputs/StyledTextField';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { DeleteForever } from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import HelperPopover from '../../HelperPopover';

type HeaderRow = {
  keyName?: string;
  mappedFieldName?: string;
};

interface RecordWithHeaders {
  headers?: Record<string, string>;
  [key: string]: any;
}

interface HeaderMappingFormProps {
  record: RecordWithHeaders;
  setRecord: (updater: (prev: RecordWithHeaders) => RecordWithHeaders) => void;
}

const HeaderMappingForm: React.FC<HeaderMappingFormProps> = ({ record, setRecord }) => {
  const [rows, setRows] = useState<HeaderRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setRows(toRows());
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const addRow = () => {
    setRows((prev) => [...prev, {}]);
  };

  const deleteRow = (index: number) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);

    const updatedHeaders = updatedRows.length === 0 ? {} : toObj(updatedRows);
    setRecord((prev) => ({ ...prev, headers: updatedHeaders }));
  };

  const handleFieldNameChange = (index: number, value: string) => {
    const updated = [...rows];
    updated[index].keyName = value;
    setRows(updated);
    setRecord((prev) => ({ ...prev, headers: toObj(updated) }));
  };

  const handleFieldValueChange = (index: number, value: string) => {
    const updated = [...rows];
    updated[index].mappedFieldName = value;
    setRows(updated);
    setRecord((prev) => ({ ...prev, headers: toObj(updated) }));
  };

  const toObj = (rows: HeaderRow[]): Record<string, string> => {
    return Object.assign(
      {},
      ...rows.map((x) => ({
        [x.keyName ?? '']: x.mappedFieldName ?? '',
      }))
    );
  };

  const toRows = (): HeaderRow[] => {
    const mapping = record.headers ?? {};
    return Object.entries(mapping).map(([key, value]) => ({
      keyName: key,
      mappedFieldName: value,
    }));
  };

  if (isLoading) return <div />;

  return (
    <Fragment>
      <IconButton onClick={addRow}>
        <AddBoxIcon />
        Add Http Header(s)
      </IconButton>
        {rows.map((row, index) => (
          <div>
            <FormControl>
              <StyledTextField
                sx={{ m: 0.75 }}
                variant="outlined"
                name="keyName"
                id="keyName"
                label="Http Header Name"
                value={row.keyName ?? ''}
                inputProps={{ 'aria-label': 'controlled' }}
                onChange={(event) => handleFieldNameChange(index, event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: 1 }}>
                      <HelperPopover message="The http header name." />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <FormControl>
              <StyledTextField
                sx={{ m: 0.75 }}
                variant="outlined"
                name="mappedFieldName"
                id="mappedFieldName"
                label="Http Header Value"
                value={row.mappedFieldName ?? ''}
                inputProps={{ 'aria-label': 'controlled' }}
                onChange={(event) => handleFieldValueChange(index, event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: 1 }}>
                      <HelperPopover message="The http header value." />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <IconButton onClick={() => deleteRow(index)}>
              <DeleteForever />
            </IconButton>
          </div>
        ))}
    </Fragment>
  );
};

export default HeaderMappingForm;
