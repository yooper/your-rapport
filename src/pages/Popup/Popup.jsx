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
import { AUTO_COLLECT_STARTING, RAPPORT } from '../../services/constants';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { getLocalItem } from '../../models/db/local';
import { debug } from '../../services/logger_services';
import { db } from '../../models/db/dexieDb';

export default function Popup() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      showLoader();
      try{
      }
      catch(e){
        // do nothing
      }
      finally{
        setIsLoading(false);
        hideLoader();
      }
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
      title: 'Deep Save (Alt+S)',
      toolTipTitle: `Collect a single screen shot and all the content of the web page. Press Alt+S to take a deep save..`,
      onClick: () => {
        chrome.runtime.sendMessage({ cmd: 'deepSave' }).then(response => {
          processNotification({
            title: 'Deep Save Collected',
            message: `A deep save has been collected. You can press Alt+S to collect a deep save.`,
            type: 'success',
          });
        });
      }
    },
    {
      title: 'Dashboard (Alt+X)',
      toolTipTitle: `Search by free text and filters, export, and import your data from Your Rapport. Alt+X to open the dashboard.`,
      onClick: async () =>
        await chrome.tabs.create({ url: chrome.runtime.getURL('search.html') }),
    },
    {
      title: 'Autoscroll Collect (Alt+A)',
      toolTipTitle: `Autoscroll collect has started. Press this button, again or press Alt+Z to stop autoscroll. It will stop when it hits the bottom.`,
      onClick: () => {
        (async () => {
          await chrome.runtime.sendMessage({ cmd: AUTO_COLLECT_STARTING });
          processNotification({
            title: 'Autoscroll Collect Started',
            message: `Autoscroll collect has started. Press this button, again or press Alt+Z to stop autoscroll. It will stop when it hits the bottom.`,
            type: 'success',
          });
        })();
        return true;
      },
    },
    {
      title: 'Automations',
      toolTipTitle: `Tired of doing it the hard way? Try out the automation features; like bulk collect.`,
      onClick: async () =>
        await chrome.tabs.create({
          url: chrome.runtime.getURL('automation.html'),
        }),
    },
    {
      title: 'Quick Scan (Alt+Q)',
      toolTipTitle: `Scans the open page for your pre-existing selectors. The Extension pin will show the counts.`,
      onClick: async () => {
        await scanPage(await getActiveTab());
      },
    },
    {
      title: 'Configurations',
      toolTipTitle: `Adjust a variety of configurations, settings, and options.`,
      onClick: async () =>
        await chrome.tabs.create({
          url: chrome.runtime.getURL('options.html'),
        }),
    },
    {
      title: 'Documentation',
      toolTipTitle: `The wiki docs for this product and its source code.`,
      onClick: () => window.open('https://github.com/yooper/your-rapport/wiki'),
    },
    {
      title: 'Discovery Plugins',
      toolTipTitle: `Learn about discovery plugins and how they can save your time through pre-existing automations.`,
      onClick: () =>
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html?view=discoveryPlugin'),
        }),
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
      <Grid item xs={12}>
        <BasicTable />
      </Grid>
    </Grid>
  );
}

function BasicTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [capturedOn, setCapturedOn] = useState(null);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      const currentUrl = new URL((await getActiveTab()).url);
      const baseUrl = currentUrl.origin + currentUrl.pathname;
      debug(`base url is ${baseUrl}`);
      const rapports = await db.rapport.orderBy('updatedOn').reverse().toArray();
      const found = rapports.find((r) => r.url?.startsWith(baseUrl));
      if (found) {
        debug(`found last captured on ${found.url}`);
        setCapturedOn(found.createdOnLocalTime);
      } else {
        setCapturedOn('NEVER');
      }

      setIsLoading(false);
      hideLoader();
    }

    fetchData();
  }, []);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="vertical table">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              Last Captured On:
            </TableCell>
            <TableCell>{isLoading ? '....' : capturedOn}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
