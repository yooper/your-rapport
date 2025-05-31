import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material';
import { getDarkTheme } from '../../utilities/loaders';
import { ReactNotifications } from 'react-notifications-component';
import TopAppBar from '../../components/TopAppBar';
import './index.css';
import AutomationLayout from '../../components/layouts/AutomationLayout';

function App() {
  return (
    <Fragment>
      <ReactNotifications />
      <AutomationLayout />
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
