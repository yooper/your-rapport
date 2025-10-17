import React, { Fragment, useEffect, useState, MouseEvent } from 'react';
import FormControl from '@mui/material/FormControl';
import {
  StyledTextField,
  StyledTextFieldNoWidth,
} from '../../inputs/StyledTextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import HelpIcon from '@mui/icons-material/Help';
import { Popover } from '@mui/material';
import HelperPopover from '../../HelperPopover';
import { debug } from '../../../services/logger_services';
import { DiscoveryPlugin } from '../../../models/schemas/DiscoveryPlugin';
import { DiscoveryPluginFormProps } from '../../../types';


const GroupHomeSupportForm: React.FC<DiscoveryPluginFormProps> = ({
  record,
  setRecord,
}) => {
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handlePopoverOpen = (event: MouseEvent<SVGSVGElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // to do get groups...
        const groups = []
        setGroupNames(groups ?? []);
      } catch (err) {
        debug('Fetch failed for group names endpoint');
        setGroupNames([]);
      }
    }
    fetchData();
  }, []);

  return (
    <Fragment>
      <Typography variant="h6">Group, Home, & Support Fields</Typography>
      <FormGroup>
        {/* Group Name */}
        <FormControl>
          <Autocomplete
            sx={{ m: 0.75, width: 500 }}
            id="groupName"
            freeSolo
            options={groupNames}
            value={record.groupName ?? ''}
            onInputChange={(_, value) =>
              setRecord((prev) => ({ ...prev, groupName: value }))
            }
            renderInput={(params) => (
              <StyledTextFieldNoWidth
                {...params}
                label="Group Name"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      <InputAdornment position="end" sx={{ mr: 0.5 }}>
                        <HelperPopover message="Group names help cluster similar Discovery Plugins together." />
                      </InputAdornment>
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </FormControl>

        {/* Home Page */}
        <FormControl>
          <StyledTextFieldNoWidth
            required
            sx={{ m: 0.75, width: 500 }}
            name="homePage"
            id="homePage"
            label="Home Page"
            defaultValue={record.homePage ?? ''}
            onChange={(e) =>
              setRecord((prev) => ({ ...prev, homePage: e.target.value }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <HelperPopover message="The home page of the discovery plugin." />
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        {/* Support Page */}
        <FormControl>
          <StyledTextFieldNoWidth
            required
            sx={{ m: 0.75, width: 500 }}
            name="supportPage"
            id="supportPage"
            label="Support Page"
            defaultValue={record.supportPage ?? ''}
            onChange={(e) =>
              setRecord((prev) => ({ ...prev, supportPage: e.target.value }))
            }
            inputProps={{ 'aria-label': 'controlled' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <HelperPopover message="The support page for the discovery plugin." />
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
      </FormGroup>
    </Fragment>
  );
};

export default GroupHomeSupportForm;
