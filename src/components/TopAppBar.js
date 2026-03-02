import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Tooltip } from '@mui/material';
import { createTab } from '../utilities/loaders';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { useEffect, useState } from 'react';
import { getUser } from '../models/schemas/User';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import { Configuration } from '../models/schemas/Configuration';
import SecurityIcon from '@mui/icons-material/Security';
import { allSitesAccessApproved, removeAllSitesAccess, requestAllSitesAccess } from '../services/manifest_permissions';

export default function TopAppBar() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [auth, setAuth] = React.useState(true);
  const [configuration, setConfiguration] = useState({})
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    async function fetchData(){
      const user = await getUser();
      setAuth(user && user.verify() ? true : false);
      setConfiguration(await Configuration.getConfiguration());
      setHasPermission(await allSitesAccessApproved());
    }
    fetchData();
  }, []);


  const menuItems = [
    { name: 'support', label: 'Support This App($3 per month)', url: 'https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00', title:'Help support this app and make this menu item disappear.' },
    { name: 'search', label: 'Dashboard', url: '/search.html', title:'Search, filter, and explore your collection' },
    { name: 'automations', label: 'Automations', url: '/automation.html', title:'Manage the back log of automations that are queued up to run.' },
    { name: 'options', label: 'Configurations', url: '/options.html', title:'Configure settings, add Api Keys, Tags, Selectors, install Discovery Plugins and more' },
    { name: 'discoveryPlugin', label: 'Discovery Plugins', url: '/options.html?view=discoveryPlugin', title:'Adjust which discovery plugins are active or set to run automatically.' },
    { name: 'documentation', label: 'Documentation', url: 'https://github.com/yooper/your-rapport/wiki', title:'Adjust which discovery plugins are active or set to run automatically.' },
    { name: 'logOut', label: 'Log Out', url: '/login.html?logout=true', title:'Log out of the application.' },
  ];

  const getMenuItems = async() => {
    const user = await getUser();

    if(!user){
      menuItems.filter(m => m.name !== 'logOut')
    }
    else{
      menuItems.filter(m => m.name !== 'support')
    }

  }

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = async(event) => {
    setAnchorEl(null);
    const { optionValue } = event.currentTarget.dataset;
    const found = menuItems.find((menuItem) => menuItem.name === optionValue);
    if(found){
      createTab(found.url, '_blank');
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            onClick={handleMenu}
            aria-controls="menu-appbar"
            aria-haspopup="true"
          >
                <img alt="Your Rapport" src="/icon-48.png" />
          </IconButton>
          <Menu
            id="main-menu"
            anchorEl={anchorEl}
            keepMounted
            open={open}
            onClose={handleClose}
          >
          {getMenuItems() &&
            menuItems.map((menuItem) => (
            <Tooltip title={menuItem.title}>
              <MenuItem
                aria-label={menuItem.title}
                key={menuItem.label}
                onClick={handleClose}
                data-option-value={menuItem.name}
              >
                {menuItem.label}
              </MenuItem>
            </Tooltip>
            ))}
          </Menu>
          <span>&nbsp;&nbsp;&nbsp;</span>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            Your Rapport
          </Typography>
          <div>

          </div>

          <Tooltip
            title={ hasPermission ? 'Advanced Scheduled Automations Enabled' : 'Enable the extension access to websites. Turning this feature on enables automations and streamlines data extraction processes.'}>
            <IconButton
              size="large"
              aria-label=""
              color="inherit"
              onClick={async() => {
                if(hasPermission) {
                  alert('TODO: Find docs to remove permissions.');
                  setHasPermission(false);
                }
                else {
                  const isPermitted = await requestAllSitesAccess();
                  setHasPermission(isPermitted);
                }
              }}
            >
              <SecurityIcon color={ hasPermission ? 'primary' : 'error'}/>
            </IconButton>
          </Tooltip>


          {auth && configuration.syncBackgroundEnabled ? (
            <Tooltip title={'Local data sync is active'}>
              <IconButton
                size="large"
                aria-label="Local data sync is active."
                color="inherit"
                onClick={() => createTab('https://github.com/yooper/your-rapport/wiki/Pro-features')}
              >
                <SyncIcon color={'info'} />
              </IconButton>
            </Tooltip>
              ) : (

            <Tooltip title={'Local data sync is inactive, upgrade to the Pro to active the local data sync feature. Or log in.'}>
              <IconButton
                size="large"
                aria-label="User has not been authenticated. Pro features are unavailable."
                color="inherit"
                onClick={() => createTab(`https://github.com/yooper/your-rapport/wiki/Pro-features`)}
              >
                <SyncDisabledIcon color={'info'} />
              </IconButton>
            </Tooltip>
            )
           }
          { auth ? (
            <Tooltip title={'Thank you for your support, all pro features are enabled.'}>
              <IconButton
                size="large"
                aria-label="User has been authenticated. Pro options enabled."
                color="inherit"
                onClick={() => createTab('https://github.com/yooper/your-rapport/wiki/Pro-features')}
              >
                <PersonIcon color={'info'}/>
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={'User is not authenticated, pro options are not available.'}>
              <IconButton
                size="large"
                aria-label="User has not been authenticated. Pro features are unavailable."
                color="inherit"
                onClick={() => createTab(`chrome-extension://${chrome.runtime.id}/login.html`)}
              >
                <PersonOffIcon color={'info'} />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
