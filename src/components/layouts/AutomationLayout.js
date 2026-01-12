import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WebIcon from '@mui/icons-material/Web';
import HelperPopover from '../HelperPopover';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import AlarmIcon from '@mui/icons-material/Alarm';
import BulkAutomationTable from '../tables/BulkAutomationDataTable';
import { BULK_AUTOMATION } from '../../services/constants';
import IconButton from '@mui/material/IconButton';
import { Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { createTab } from '../../utilities/loaders';
import ScheduledAutomationDataTable from '../tables/ScheduledAutomationDataTable';

export default function AutomationLayout() {
  const urlParams = new URL(window.location.href).searchParams;
  const [selectedComponent, setSelectedComponent] = useState(
    urlParams.get('view') ?? BULK_AUTOMATION
  );

  const componentMap = [
    {
      label: 'Bulk Collect Automation',
      key: BULK_AUTOMATION,
      message:
        'Insert a list of urls that will be opened in a tab and collected',
      url: 'https://github.com/yooper/your-rapport/wiki/Setting-Up-And-Running-Automations'
    },
    {
      label: 'Scheduled Automations',
      key: 'scheduled_automation',
      message:
        'Set up a scheduled time to open a page and collect',
      url: 'https://github.com/yooper/your-rapport/wiki/scheduled-automations'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid xs={2}>
          <List sx={{ color: 'white' }}>
            {componentMap.map((component, index) => (
              <ListItem
                key={component.label}
                disablePadding
                onClick={() => setSelectedComponent(component.key)}
              >
                <ListItemButton>
                  <ListItemIcon>
                    <IconMapper icon={component.key} />
                  </ListItemIcon>
                  <IconButton>
                    <Tooltip title={'Click to learn more..'}>
                      <OpenInNewIcon onClick={(e) => {
                        e.stopPropagation();
                        // open a tab to the wiki page for this subject
                        createTab(component.url);
                      }}/>
                    </Tooltip>
                  </IconButton>
                  <IconButton>
                  <HelperPopover message={component.message} />
                  </IconButton>
                  &nbsp;
                  <ListItemText primary={component.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid xs={10}>
          <Renderer selectedComponent={selectedComponent} />
        </Grid>
      </Grid>
    </Box>
  );
}

function IconMapper(props) {
  switch (props.icon) {
    case BULK_AUTOMATION:
      return <LibraryAddIcon />;
    case 'scheduled_automation':
      return <AlarmIcon />;
    default:
      return <WebIcon />;
  }
}

function Renderer(props) {
  switch (props.selectedComponent) {
    case BULK_AUTOMATION:
      return <BulkAutomationTable />;
    case 'scheduled_automation':
      return <ScheduledAutomationDataTable />;
    case 'selector_automation':
      return <div>TODO...</div>;
    default:
      return <div>Unknown setting</div>;
  }
}
