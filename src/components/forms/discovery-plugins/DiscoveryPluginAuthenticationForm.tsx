import React, { Fragment } from 'react';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import { StyledTextField, StyledTextFieldNoWidth } from '../../inputs/StyledTextField';
import { Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { InfoOutlined } from '@mui/icons-material';
import { ApiKey } from '../../../types';
import Autocomplete from '@mui/material/Autocomplete';

const DiscoveryPluginAdvancedForm: ({
    record,
    setRecord,
    apiKeys
  }: { record: any; setRecord: any; apiKeys: any }) => void = ({ record, setRecord, apiKeys }) => {

  const apiKeyNames = apiKeys.map((apiKey: ApiKey) => `{{${apiKey.key}}}`);

  return (
    <Fragment>
      <Typography variant="h6">
        <Tooltip
          title={
            'To learn more about Authentication your data click to be sent to our wiki docs.'
          }
        >
          <IconButton onClick={() => {}}>
            <InfoOutlined />
          </IconButton>
        </Tooltip>
        Authentication
      </Typography>
      <FormGroup>
        <FormControl>
          <Autocomplete
            sx={{ m: 0.75, width: 500 }}
            freeSolo
            options={apiKeyNames}
            value={record.authorizationBearerToken ?? ''}
            onInputChange={(_, value) =>
              setRecord((prevState) => {
                return ({
                  ...prevState,
                  authorizationBearerToken: value,
                });
              })
              }
            renderInput={(params) => (
              <StyledTextFieldNoWidth {...params} label="Authorization Bearer Token" />
            )}
          />
        </FormControl>
        <FormControl>
          <Autocomplete
            sx={{ m: 0.75, width: 500 }}
            freeSolo
            options={apiKeyNames}
            value={record.authorizationUserName ?? ''}
            onInputChange={(_, value) =>
              setRecord((prevState) => {
                return ({
                  ...prevState,
                  authorizationUserName: value,
                });
              })
              }
            renderInput={(params) => (
              <StyledTextFieldNoWidth {...params} label="Authorization User Name" />
            )}
          />
        </FormControl>

        <FormControl>
          <Autocomplete
            sx={{ m: 0.75, width: 500 }}
            freeSolo
            options={apiKeyNames}
            value={record.authorizationPassword ?? ''}
            onInputChange={(_, value) =>
              setRecord((prevState) => {
                return ({
                  ...prevState,
                  authorizationPassword: value,
                });
              })
              }
            renderInput={(params) => (
              <StyledTextFieldNoWidth {...params} label="Authorization Password" />
            )}
          />
        </FormControl>
      </FormGroup>
    </Fragment>
  );
};

export default DiscoveryPluginAdvancedForm;
