import React, { Fragment } from 'react';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import {StyledTextField} from '../../inputs/StyledTextField';
import { Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { InfoOutlined } from '@mui/icons-material';


const DiscoveryPluginAdvancedForm: React.FC<DiscoveryPluginAdvancedFormProps> = ({
  record,
  setRecord,
}) => {


  return (
    <Fragment>
      <Typography variant="h6">
        <Tooltip title={'To learn more about Authentication your data click to be sent to our wiki docs.'}>
        <IconButton onClick={()=>{}}>
          <InfoOutlined />
        </IconButton>
      </Tooltip>
        Authentication
      </Typography>
      <FormGroup>
        <FormControl>
          <StyledTextField
            sx={{ m: 0.75 }}
            name="authorizationBearerToken"
            id="authorizationBearerToken"
            label="Authorization Bearer Token"
            defaultValue={record.authorizationBearerToken}
            onChange={(e) =>
              setRecord((prevState) => ({
                ...prevState,
                authorizationBearerToken: e.target.value,
              }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </FormControl>

        <FormControl>
          <StyledTextField
            sx={{ m: 0.75 }}
            name="authorizationUserName"
            id="authorizationUserName"
            label="Authorization User Name"
            defaultValue={record.authorizationUserName}
            onChange={(e) =>
              setRecord((prevState) => ({
                ...prevState,
                authorizationUserName: e.target.value,
              }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </FormControl>

        <FormControl>
          <StyledTextField
            sx={{ m: 0.75 }}
            name="authorizationPassword"
            id="authorizationPassword"
            label="Authorization Password"
            defaultValue={record.authorizationPassword}
            onChange={(e) =>
              setRecord((prevState) => ({
                ...prevState,
                authorizationPassword: e.target.value,
              }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </FormControl>
      </FormGroup>
    </Fragment>
  );
};

export default DiscoveryPluginAdvancedForm;
