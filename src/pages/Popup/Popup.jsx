import './Popup.css';
import Grid from '@mui/material/Unstable_Grid2';
import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  getActiveTab,
  hideLoader,
  processNotification,
  showLoader,
} from '../../utilities/loaders';
import Typography from '@mui/material/Typography';
import { ButtonBase, Tooltip } from '@mui/material';
import { scanPage } from '../../utilities/transformers';
import { capture } from '../../datasources/browser_capture';
import { captureSingleScreenShot } from '../../services/collection_services';
import { AUTO_COLLECT_STARTING } from '../../services/constants';

export default function Popup() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(false);
      hideLoader();
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <div></div>;
  }
  return <LargeButtonGrid />;
}

function LargeButtonGrid() {
  const buttons = [
    {
      title: 'Autoscroll Collect',
      toolTipTitle: `Autoscroll collect has started. Press this button, again or press Crtl+Shift+Z to stop autoscroll. It will stop when it hits the bottom.`,
      onClick: () => {
        (async () => {
          const tab = await getActiveTab();
          await chrome.runtime.sendMessage({cmd: AUTO_COLLECT_STARTING });
          processNotification({
            title: 'Autoscroll Collect Started',
            message: `Autoscroll collect has started. Press this button, again or press Crtl+Shift+Z to stop autoscroll. It will stop when it hits the bottom.`,
            type: 'success',
          });
        })();
        return true;
      },
    },
    {
      title: 'Single Collect',
      toolTipTitle: `Collect a single screenshot. Press Crtl+Shift+S to take a single screenshot.`,
      onClick: () => {
        (async () => {
          await chrome.runtime.sendMessage({cmd: 'popupSingleCollect' });
          processNotification({
            title: 'Single Collected',
            message: `A single screenshot has been collected. You can press Crtl+Shift+S to take a single screenshot.`,
            type: 'success',
          });
        })();
        return true;
      },
    },
    {
      title: 'Search Dashboard',
      toolTipTitle: `Search by free text and filters, export, and import your data from Your Rapport. Ctrl+Shift+X to open the dashboard.`,
      onClick: async () =>
        await chrome.tabs.create({ url: chrome.runtime.getURL('search.html') }),
    },
    {
      title: 'Automation',
      toolTipTitle: `Tired of doing it the hard way? Try out the automation features; like bulk collect.`,
      onClick: async () =>
        await chrome.tabs.create({
          url: chrome.runtime.getURL('automation.html'),
        }),
    },
    {
      title: 'Quick Scan',
      toolTipTitle: `Scans the open page for your pre-existing selectors. The Extension pin will show the counts. Ctrl+Shift+F will run this command.`,
      onClick: async () => {
        await scanPage(await getActiveTab());
      },
    },
    {
      title: 'Settings',
      toolTipTitle: `Adjust a variety of configurations, settings, and options.`,
      onClick: async () =>
        await chrome.tabs.create({ url: chrome.runtime.getURL('options.html') }),
    },
    {
      title: 'Wiki Docs',
      toolTipTitle: `The wiki docs for this product and its source code.`,
      onClick: () => window.open('https://github.com/yooper/your-rapport/wiki/Your-Rapport-Docs'),
    },
    {
      title: 'Help / Issues',
      toolTipTitle: `File a github issue.`,
      onClick: () => window.open('https://github.com/yooper/your-rapport/issues'),
    },
  ];

  return (
    <Grid container spacing={2}>
      {buttons.map((button, index) => (
        <Grid item xs={6} key={index}>
          <Tooltip title={button.toolTipTitle}>
            <ButtonBase
              onClick={button.onClick}
              color={'primary'}
              sx={{
                width: '100%',
                height: 50, // Adjust height here
                borderRadius: 2,
                border: '1px solid #ccc',
                boxShadow: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#ffe88b',
                p: 2,
              }}
            >
              <Typography variant="h6">{button.title}</Typography>
            </ButtonBase>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
}
