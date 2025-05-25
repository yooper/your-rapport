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
import { ButtonBase } from '@mui/material';
import { scanPage } from '../../utilities/transformers';

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
      onClick: () => {
        chrome.runtime
          .sendMessage({
            cmd: 'autoscrollCollect',
          })
          .then((response) => {
            processNotification({
              title: 'Autoscroll Collect Started',
              message: `Autoscroll collect has started. Press this button, again or press Crtl+Shift+Z to stop autoscroll. It will stop when it hits the bottom.`,
              type: 'success',
            });
          });
      },
    },
    {
      title: 'Single Collect',
      onClick: () => {
        chrome.runtime
          .sendMessage({
            cmd: 'popupSingleCollect',
          })
          .then((response) => {
            processNotification({
              title: 'Single Collect',
              message: `Single screenshot collected.`,
              type: 'success',
            });
          });
      },
    },
    {
      title: 'Search Dashboard',
      onClick: async () =>
        await chrome.tabs.create({ url: chrome.runtime.getURL('search.html') }),
    },
    {
      title: 'Docs',
      onClick: () => window.open('https://github.com/yooper/your-rapport'),
    },
    {
      title: 'Quick Scan',
      onClick: async () => {
        scanPage(await getActiveTab());
      },
    },
    {
      title: 'Automation',
      onClick: async () =>
        await chrome.tabs.create({
          url: chrome.runtime.getURL('automation.html'),
        }),
    },
  ];

  return (
    <Grid container spacing={2}>
      {buttons.map((button, index) => (
        <Grid item xs={6} key={index}>
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
        </Grid>
      ))}
    </Grid>
  );
}
