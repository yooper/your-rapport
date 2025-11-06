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
import { DISCOVERY_PLUGIN } from '../../services/constants';
import TagDataTable from '../tables/TagDataTable';
import TagIcon from '@mui/icons-material/Tag';
import ApiKeyDataTable from '../tables/ApiKeyDataTable';
import ApiIcon from '@mui/icons-material/Api';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import IconButton from '@mui/material/IconButton';
import { Tooltip } from '@mui/material';
import { createTab } from '../../utilities/loaders';


export default function OptionsLayout() {
  const urlParams = new URL(window.location.href).searchParams;

  const [selectedComponent, setSelectedComponent] = useState(
    urlParams.get('view') ?? 'browser'
  );
  const componentMap = [
    {
      label: 'Api Key',
      key: 'apiKey',
      message: 'Manage your local api keys that integrate with your third party plugins.',
      url: 'https://github.com/yooper/your-rapport/wiki/Api-Key-Management'
    },
    {
      label: 'Browser Settings',
      key: 'browser',
      message: 'Modify browser specific settings',
      url: 'https://github.com/yooper/your-rapport/wiki/Your-Rapport-Browser-Settings'
    },
    {
      label: 'Discovery Plugins',
      key: 'discoveryPlugin',
      message: 'Connect or enrich your data to other service providers. Autolinks data repositories to your selectors.',
      url: 'https://github.com/yooper/your-rapport/wiki/Discovery-Plugins-Tutorial'
    },
    {
      label: 'Package Management',
      key: 'packageManagement',
      message: 'Packages enhance and extend Your Rapport functionality. When you install a package it becomes a discovery plugin. Discovery plugins help you search for selectors.',
      url: 'https://github.com/osint-liar/public-packages'
    },
    {
      label: 'Selectors',
      key: 'selector',
      message: 'Manage your selectors through creation and deletion.',
      url: 'https://github.com/yooper/your-rapport/wiki/Your-Rapport-Selectors'
    },
    {
      label: 'Tags',
      key: 'tag',
      message: 'Manage your tags used for annotating data',
      url: 'https://github.com/yooper/your-rapport/wiki/Your-Rapport-Tag-Management'
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
    case 'apiKey':
      return <ApiIcon />
    case 'browser':
      return <WebIcon />;
    case 'discoveryPlugin':
      return <ExtensionIcon />;
    case 'packageManagement':
      return <ListAltIcon />;
    case 'selector':
      return <LocalOfferIcon />;
    case 'tag':
      return <TagIcon />;
    default:
      return <WebIcon />;
  }
}

function Renderer(props) {
  switch (props.selectedComponent) {
    case 'apiKey':
      return <ApiKeyDataTable />;
    case 'browser':
      return <BrowserSettingsForm />;
    case 'discoveryPlugin':
      return <DiscoveryPluginDataTable />;
    case 'packageManagement':
      return <PackageManagerDataTable />;
    case 'selector':
      return <SelectorDataTable />;
    case 'tag':
      return <TagDataTable />;
    default:
      return <div>Unknown setting</div>;
  }
}
