import React, { Fragment } from 'react';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import {StyledTextField} from '../../inputs/StyledTextField';
import IconButton from '@mui/material/IconButton';
import { InfoOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

type DiscoveryPluginAdvancedFormProps = {
  record: {
    method?: string;
    contentTypeHeader?: string;
    [key: string]: any;
  };
  setRecord: (updater: (prev: any) => any) => void;
};

const DiscoveryPluginAdvancedForm: React.FC<DiscoveryPluginAdvancedFormProps> = ({
  record,
  setRecord,
}) => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const contentTypeHeaders = ['', 'application/json', 'multipart/form-data', 'application/octet-stream'];

  return (
    <Fragment>
      <Typography variant="h6">
        <Tooltip title={'To learn more about HTTP Methods and Content Types your data click to be sent to our wiki docs.'}>
          <IconButton onClick={()=>{}}>
            <InfoOutlined />
          </IconButton>
        </Tooltip>
        HTTP Method & Content Type
      </Typography>
      <FormGroup>
        <FormControl>
          <StyledTextField
            sx={{ m: 0.75 }}
            select
            variant="outlined"
            name="method"
            id="method"
            label="HTTP Method"
            defaultValue={record.method ?? 'GET'}
            onChange={(e) =>
              setRecord((prevState) => ({
                ...prevState,
                method: e.target.value,
              }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
          >
            {methods.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </StyledTextField>
        </FormControl>

        <FormControl>
          <Autocomplete
            sx={{ m: 0.75 }}
            freeSolo
            options={contentTypeHeaders}
            value={record.contentTypeHeader ?? ''}
            onInputChange={(_, value) =>
              setRecord((prevState) => ({
                ...prevState,
                contentTypeHeader: value,
              }))
            }
            renderInput={(params) => <StyledTextField {...params} label="Content Type Header" />}
          />
        </FormControl>

      </FormGroup>
    </Fragment>
  );
};

export default DiscoveryPluginAdvancedForm;
