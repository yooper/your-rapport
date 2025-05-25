import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';
import ExtensionIcon from '@mui/icons-material/Extension';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WebIcon from '@mui/icons-material/Web';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HelperPopover from '../HelperPopover';
import BrowserSettingsForm from '../forms/BrowserSettingsForm';
import PackageManagerDataTable from '../tables/PackageManagerDataTable';
import SelectorDataTable from '../tables/SelectorDataTable';
import DiscoveryPluginDataTable from '../tables/DiscoveryPluginDataTable';

export default function OptionsLayout() {
  const urlParams = new URL(window.location.href).searchParams;

  const [selectedComponent, setSelectedComponent] = useState(
    urlParams.get('view') ?? 'browser'
  );

  const componentMap = [
    {
      label: 'Browser Settings',
      key: 'browser',
      message: 'Modify browser specific settings',
    },
    {
      label: 'Discovery Plugins',
      key: 'discovery_plugin',
      message:
        'Connect or enrich your data to other service providers. Autolinks data repositories to your selectors.',
    },
    {
      label: 'Package Management',
      key: 'package_management',
      message:
        'Packages enhance and extend Your Rapport functionality. When you install a package it becomes a discovery plugin. Discovery plugins help you search for selectors.',
    },
    {
      label: 'Selectors',
      key: 'selector',
      message: 'Create or Delete selectors',
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
    case 'browser':
      return <WebIcon />;
    case 'discovery_plugin':
      return <ExtensionIcon />;
    case 'package_management':
      return <ListAltIcon />;
    case 'selector':
      return <LocalOfferIcon />;
    default:
      return <WebIcon />;
  }
}

function Renderer(props) {
  switch (props.selectedComponent) {
    case 'browser':
      return <BrowserSettingsForm />;
    case 'discovery_plugin':
      return <DiscoveryPluginDataTable />;
    case 'package_management':
      return <PackageManagerDataTable />;
    case 'selector':
      return <SelectorDataTable />;
    default:
      return <div>Unknown setting</div>;
  }
}
