import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';

import 'react-notifications-component/dist/theme.css';
import { ReactNotifications } from 'react-notifications-component';
import Search from './Search';
import './index.css';
import { createTheme, ThemeProvider } from '@mui/material';
import { getDarkTheme } from '../../utilities/loaders';
import { initExtensionPage } from '../../services/init_services';

initExtensionPage()

function App() {
  return (
    <Fragment>
      <ReactNotifications />
      <Search title={'Scan and Search'} />
    </Fragment>
  );
}

const container = document.getElementById('app-container');
const root = createRoot(container);
root.render(
  <ThemeProvider theme={createTheme(getDarkTheme())}>
    <App />
  </ThemeProvider>
);
