import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material';
import { getDarkTheme } from '../../utilities/loaders';
import { ReactNotifications } from 'react-notifications-component';
import OptionsLayout from '../../components/layouts/OptionsLayout';
import TopAppBar from '../../components/TopAppBar';
import './index.css';
import 'react-notifications-component/dist/theme.css';
import { initExtensionPage } from '../../services/init_services';

initExtensionPage();

function App() {
  return (
    <Fragment>
      <ReactNotifications />
      <OptionsLayout />
    </Fragment>
  );
}

const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <ThemeProvider theme={createTheme(getDarkTheme())}>
    <TopAppBar />
    <App />
  </ThemeProvider>
);
