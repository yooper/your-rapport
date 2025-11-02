import React, { Fragment, useEffect, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import {
  StyledTextField,
  StyledTextFieldNoWidth,
} from '../../inputs/StyledTextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import { Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { InfoOutlined } from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import HelperPopover from '../../HelperPopover';
import { DiscoveryPluginFormProps, EventType, PluginAction } from '../../../types';

const DiscoveryPluginBasicForm: React.FC<DiscoveryPluginFormProps> = ({
  record,
  setRecord,
  pluginTypes,
}) => {
  const actions: {
    label: string;
    action: PluginAction;
    description: string;
  }[] = [
    {
      label: 'Open Browser Tab',
      action: 'CreateTab',
      description: 'Open browser tab to the generated content.',
    },
    {
      label: 'Submit Form',
      action: 'SubmitForm',
      description:
        'Submit a form and process the results and it opens a web page.',
    },

    {
      label: 'Foreground Runner',
      action: 'ForegroundRunner',
      description:
        'Run a data processing task in the foreground of the browser.',
    },
    {
      label: 'Background Runner',
      action: 'BackgroundRunner',
      description:
        'Run a data processing task in the background service worker of the browser.',
    },

  ];

  const eventTypes: { label: string; eventType: EventType }[] = [
    { label: 'Pre Create', eventType: 'preCreate' },
    { label: 'Post Create', eventType: 'postCreate' },
    { label: 'Pre Update', eventType: 'preUpdate' },
    { label: 'Post Update', eventType: 'postUpdate' },
    { label: 'Pre Delete', eventType: 'preDelete' },
    { label: 'Post Delete', eventType: 'postDelete' },
  ];

  const [disablePluginType, setDisablePluginType] = useState<boolean>(
    record.action === 'BackgroundRunner'
  );

  useEffect(() => {
    setDisablePluginType(record.action === 'BackgroundRunner');
  }, [record.action]);

  return (
    <Fragment>
      <Typography variant="h6">
        <Tooltip
          title={
            'To learn more about Required Plugin Fields your data click to be sent to our wiki docs.'
          }
        >
          <IconButton onClick={() => {}}>
            <InfoOutlined />
          </IconButton>
        </Tooltip>
        Required Plugin Fields
      </Typography>
      <FormGroup>
        <FormControl>
          <StyledTextFieldNoWidth
            fullWidth
            required
            sx={{ m: 0.75 }}
            name="label"
            id="label"
            label="Label"
            defaultValue={record.label ?? ''}
            onChange={(e) =>
              setRecord((prevState) => ({
                ...prevState,
                label: e.target.value,
              }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </FormControl>
        <FormControl>
          <StyledTextFieldNoWidth
            required
            fullWidth
            sx={{ m: 0.75 }}
            name="url"
            id="url"
            label="Plugin Url"
            defaultValue={record.url ?? ''}
            onChange={(e) =>
              setRecord((prevState) => ({ ...prevState, url: e.target.value }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </FormControl>
      </FormGroup>

      <FormGroup>
        <Grid container>
          <Grid item>
            <FormControl>
              <StyledTextField
                sx={{ m: 0.75 }}
                variant="outlined"
                name="action"
                select
                id="action"
                label="Action"
                defaultValue={record.action ?? 'CreateTab'}
                onChange={(e) => {
                  const action = e.target.value as PluginAction;
                  setRecord((prevState) => ({ ...prevState, action }));
                  if (action === 'BackgroundRunner') {
                    setRecord((prevState) => ({
                      ...prevState,
                      pluginType: 'event',
                    }));
                    setDisablePluginType(true);
                  } else {
                    setRecord((prevState) => ({
                      ...prevState,
                      pluginType: 'content',
                    }));
                    setDisablePluginType(false);
                  }
                }}
                inputProps={{ 'aria-label': 'controlled' }}
                helperText="Use the default Create Tab, for most cases."
              >
                {actions.map((action) => (
                  <MenuItem key={action.action} value={action.action}>
                    {action.label}
                  </MenuItem>
                ))}
              </StyledTextField>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl>
              <StyledTextField
                disabled={record.action !== 'BackgroundRunner'}
                sx={{ m: 0.75 }}
                variant="outlined"
                name="eventType"
                select
                id="eventType"
                label="Event Type"
                defaultValue={record.eventType ?? 'preCreate'}
                onChange={(e) =>
                  setRecord((prevState) => ({
                    ...prevState,
                    eventType: (e.target.value ?? 'preCreate') as EventType,
                  }))
                }
                inputProps={{ 'aria-label': 'controlled' }}
                helperText="The plugin will run during this event."
              >
                {eventTypes.map((event) => (
                  <MenuItem key={event.eventType} value={event.eventType}>
                    {event.label}
                  </MenuItem>
                ))}
              </StyledTextField>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item>
            <FormControl>
              <Autocomplete
                disabled={disablePluginType}
                sx={{ m: 0.75 }}
                freeSolo
                options={pluginTypes}
                value={record.pluginType ?? 'content'}
                onInputChange={(_, value) =>
                  setRecord((prevState) => ({
                    ...prevState,
                    pluginType: value,
                  }))
                }
                renderInput={(params) => (
                  <StyledTextField {...params} label="Plugin Type" />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
        {/* Version */}
        <FormControl>
          <StyledTextField
            required
            sx={{ m: 0.75 }}
            name="version"
            id="version"
            label="Version"
            defaultValue={record.version ?? '0.0.1'}
            onChange={(e) =>
              setRecord((prev) => ({ ...prev, version: e.target.value }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <HelperPopover message="Software changes and tracking the version helps identify incompatibility issues." />
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
      </FormGroup>
    </Fragment>
  );
};

export default DiscoveryPluginBasicForm;
