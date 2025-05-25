import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
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
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="main-menu"
            anchorEl={anchorEl}
            keepMounted
            open={open}
            onClose={handleClose}
          >
            {menuItems.map((menuItem) => (
              <MenuItem
                key={menuItem.label}
                onClick={handleClose}
                data-option-value={menuItem.name}
              >
                {menuItem.label}
              </MenuItem>
            ))}
          </Menu>
          <span>&nbsp;&nbsp;&nbsp;</span>
          <Tooltip title="Your Rapport">
            <a href={'https://osintliar.com/store/Who-Am-I-p598981597'}>
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
