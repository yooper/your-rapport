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

export default function AutomationLayout() {
  const urlParams = new URL(window.location.href).searchParams;
  const [selectedComponent, setSelectedComponent] = useState(
    urlParams.get('view') ?? 'bulk_automation'
  );

  const componentMap = [
    {
      label: 'Bulk Automation',
      key: 'bulk_automation',
      message:
        'Insert a list of urls that will be opened in a tab and collected',
    },
    {
      label: 'Scheduled Automation',
      key: 'scheduled_automation',
      message: 'TODO: implement scheduling collection subsystem',
    },
    {
      label: 'Selector Automation',
      key: 'selector_automation',
      message: 'TODO: Discover selectors on a live page',
    },
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
                  <HelperPopover message={component.message} />
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
    case 'bulk_automation':
      return <LibraryAddIcon />;
    case 'scheduled_automation':
      return <AlarmIcon />;
    case 'selector_automation':
      return <LocalOfferIcon />;
    default:
      return <WebIcon />;
  }
}

function Renderer(props) {
  switch (props.selectedComponent) {
    case 'bulk_automation':
      return <BulkAutomationTable />;
    case 'scheduled_automation':
      return <div>TODO...</div>;
    case 'selector_automation':
      return <div>TODO...</div>;
    default:
      return <div>Unknown setting</div>;
  }
}
