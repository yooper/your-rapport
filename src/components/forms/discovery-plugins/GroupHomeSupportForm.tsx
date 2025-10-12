import React, { Fragment, useEffect, useState, MouseEvent } from 'react';
import FormControl from '@mui/material/FormControl';
import { StyledTextField } from '../../inputs/StyledTextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import HelpIcon from '@mui/icons-material/Help';
import { Popover } from '@mui/material';
import HelperPopover from '../../HelperPopover';
import { debug } from '../../../services/logger_services';
import { DiscoveryPlugin } from '../../../models/schemas/DiscoveryPlugin';

interface RecordType {
  groupName?: string;
  homePage?: string;
  supportPage?: string;
  version?: string;
  [key: string]: any;
}

interface GroupHomeSupportFormProps {
  record: RecordType;
  setRecord: (updater: (prev: RecordType) => RecordType) => void;
}

const GroupHomeSupportForm: React.FC<GroupHomeSupportFormProps> = ({ record, setRecord }) => {
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
        const groups = await DiscoveryPlugin.getGroupNames();
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
            sx={{ m: 0.75 }}
            id="groupName"
            freeSolo
            options={groupNames}
            value={record.groupName ?? ''}
            onInputChange={(_, value) =>
              setRecord((prev) => ({ ...prev, groupName: value }))
            }
            renderInput={(params) => (
              <StyledTextField
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
          <StyledTextField
            required
            sx={{ m: 0.75 }}
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
                  <HelpIcon
                    aria-owns={open ? 'mouse-over-popover' : undefined}
                    aria-haspopup="true"
                    onMouseEnter={handlePopoverOpen}
                    onMouseLeave={handlePopoverClose}
                  />
                  <Popover
                    id="mouse-over-popover"
                    sx={{ pointerEvents: 'none' }}
                    open={open}
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    onClose={handlePopoverClose}
                    disableRestoreFocus
                  >
                    <Typography sx={{ p: 1 }}>I use Popover.</Typography>
                  </Popover>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        {/* Support Page */}
        <FormControl>
          <StyledTextField
            required
            sx={{ m: 0.75 }}
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
                  <HelperPopover message="The support page an end user should visit for support." />
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

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

export default GroupHomeSupportForm;
