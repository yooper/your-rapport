import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Tooltip } from '@mui/material';
import { createTab } from '../utilities/loaders';

export default function TopAppBar() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const menuItems = [
    { name: 'search', label: 'Search Dashboard', url: '/search.html' },
    { name: 'options', label: 'Settings', url: '/options.html' },
    {
      name: 'videos',
      label: 'Training Videos',
      url: 'https://www.youtube.com/@your-rapport',
    },
    { name: 'login', label: 'Authenticate', url: '/login.html' },
  ];

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    setAnchorEl(null);
    const { optionValue } = event.currentTarget.dataset;
    const found = menuItems.find((menuItem) => menuItem.name === optionValue);

    if (found === undefined) {
      return;
    }
    createTab(found.url);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Tooltip title="Help Support - Your Rapport">
            <a
              href={'https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00'}
              target={'_blank'}
            >
              <img alt="Your Rapport" src="/icon-48.png" />
            </a>
          </Tooltip>
          <span>&nbsp;&nbsp;&nbsp;</span>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            Your Rapport
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
