import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import {
  deleteRecord,
  getLocalItem,
  setLocalItem,
  updateRecord,
} from '../../models/db/local';
import {
  hideLoader,
  processNotification,
  showLoader,
} from '../../utilities/loaders';
import BulkAutomationAddDialog from '../dialogs/automations/BulkAutomationAddDialog';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import IconButton from '@mui/material/IconButton';
import CancelIcon from '@mui/icons-material/Cancel';
import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import HelperPopover from '../HelperPopover';
import {
  BULK_AUTOMATION,
  UUID,
} from '../../services/constants';
import { debug } from '../../services/logger_services';
import ExtensionPin from '../../utilities/ExtensionPin';

export default function BulkAutomationTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      const start = performance.now();
      const data = await getLocalItem(BULK_AUTOMATION);
      if (data.length !== rows.length) {
        setRows(data);
      }
      const elapsed = performance.now() - start;
      debug(`Finished after ${Math.max(elapsed).toFixed(0)}ms`);
      hideLoader();
    }

    fetchData();

    /**
     * Check if any updates occurred
     * @type {number}
     */
    const intervalId = setInterval(async () => {
      //await fetchData(); // check for new data every 3 seconds.
    }, 3000); // wait 3 seconds before re-renders
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Initiate the process of bulk downloading the list of urls
   * @param records
   */
  async function startAutomationProcess() {

    const automations = await getLocalItem(BULK_AUTOMATION);
    automations.forEach(a => {
      if(!a.active && !a.ranOn){
        a.active = true;
        a.description = 'Queued to run'
      }
    })

    const filtered = automations.filter(r => !r.ranOn && r.active);
    if(filtered.length === 0) {
      processNotification({
        title:'No New Bulk Automations',
        message:'Enter some new web site urls in order to collect them, all your automations have already run.',
        type:'info'
      });
      return;
    }

    await setLocalItem(BULK_AUTOMATION, automations);
    await ExtensionPin.setAutomationRunning(automations);
    chrome.runtime.sendMessage({ cmd: 'AUTOMATIONS_ENQUEUE'});
    processNotification({
      title: 'Automation job(s) Queued',
      message:
        `${filtered.length} automation job(s) Queued. Don't Spam the button.`,
      type: 'success',
    });
  }


  const getRecord = (rowData) => {
    let record = {};
    for (let idx = 0; idx < columns.length; idx++) {
      record[columns[idx].name] = rowData[idx];
    }
    return record;
  };

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      const records = (await getLocalItem(BULK_AUTOMATION)) ?? [];
      if (records.length !== rows.length) {
        setRows(records);
      }
      setIsLoading(false);
      hideLoader();
    }
    fetchData();
  }, []);

  const columns = [
    {
      name: UUID,
      label: 'UUID',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    {
      name: 'url',
      label: 'URL',
      options: {
        filter: true,
        sort: false,
        searchable: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          let url = record.url;
          if (url.length > 32) {
            url = record.url.substring(0, 32) + '...';
          }
          return (
            <div>
              <span>
                <Tooltip title={record.url}>
                  <a href={record.url} target={'_blank'} rel={'noreferrer'}>
                    {url}
                  </a>
                </Tooltip>
              </span>
            </div>
          );
        },
      },
    },
    { label: 'STATUS', name: 'status' },
    {
      name: 'unit',
      label: 'UNIT',
      options: {
        display: false,
        filter: false,
        sort: false,
      },
    },
    {
      name: 'value',
      label: 'VALUE',
      options: {
        display: false,
        filter: false,
        sort: false,
      },
    },
    {
      name: 'screenShotsCollected',
      label: '# SCREENSHOTS',
      options: {
        display: false,
        filter: false,
        sort: false,
      },
    },
    {
      label: 'DEEP SAVE',
      name: 'isDeepSave',
      options: {
        display: true,
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta, updateValue) => {
          if (value === undefined) {
            return <div></div>;
          }
          const record = getRecord(tableMeta.rowData);
          return (
            <FormControlLabel
              control={
                <Switch color="primary" checked={value} />
              }
              label={
                <div>
                  <IconButton>
                    <HelperPopover
                      message={
                        'By default multiple screenshots are collected using auto collect. This setting will collect a deep save with multiple artifacts.'
                      }
                    />
                  </IconButton>
                </div>
              }
              onChange={async(event) => {
                updateValue(event.target.checked);
                record.isDeepSave = event.target.checked;
                await updateRecord(BULK_AUTOMATION, UUID, record);
              }}
            />
          );
        },
      },
    },
    {
      label: 'KEEP TAB OPEN',
      name: 'keepTabOpen',
      options: {
        display: true,
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta, updateValue) => {
          if (value === undefined) {
            return <div></div>;
          }
          const record = getRecord(tableMeta.rowData);
          return (
            <FormControlLabel
              control={
                <Switch color="primary" checked={value} />
              }
              label={
                <div>
                  <IconButton>
                    <HelperPopover
                      message={
                        'After the collection process has completed do you want the tab to stay open?'
                      }
                    />
                  </IconButton>
                </div>
              }
              onChange={async(event) => {
                updateValue(event.target.checked);
                record.keepTabOpen = event.target.checked;
                await updateRecord(BULK_AUTOMATION, UUID, record);
              }}
            />
          );
        },
      },
    },
    {
      name: 'ranOn',
      label: 'RAN ON',
      options: {
        filter: false,
        sort: true,
        searchable: false,
        customBodyRenderLite: (dataIndex) => {
          if (!rows[dataIndex].ranOn) {
            return <div></div>;
          }
          const date = new Date(parseInt(rows[dataIndex].ranOn));
          return <div>{date.toLocaleString()}</div>;
        },
      },
    },
    {
      name: 'CompletedOn',
      label: 'COMPLETED',
      options: {
        filter: false,
        sort: true,
        searchable: false,
        customBodyRenderLite: (dataIndex) => {
          if (!rows[dataIndex].completedOn) {
            return <div></div>;
          }
          const date = new Date(parseInt(rows[dataIndex].completedOn));
          return <div>{date.toLocaleString()}</div>;
        },
      },
    },
    {
      name: 'description',
      label: 'INFO',
      options: {
        filter: false,
        sort: false,
        searchable: false,
        customBodyRenderLite: (dataIndex) => {
          return <div>{rows[dataIndex].description ?? ''}</div>;
        },
      },
    },
    {
      label: 'OPTIONS',
      name: 'options',
      options: {
        display: true,
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);

          return (
            <Tooltip title={'Re run the automation on this url'}>
              <IconButton
                onClick={async () => {
                  let copy = {...record};
                  copy.active = true;
                  copy.ranOn = null;
                  copy.status = 'queued';
                  copy.completedOn = null;
                  copy.description = 'Manually run'
                  await ExtensionPin.setAutomationRunning([copy]);
                  setRows(await updateRecord(BULK_AUTOMATION, UUID, copy));
                  chrome.runtime.sendMessage({ cmd: 'AUTOMATIONS_ENQUEUE'});
                  processNotification({
                    title: 'Restarting Automation',
                    message:
                      "Automation job is restarting, and may take a couple seconds. Don't Spam the button!",
                    type: 'success',
                  });
                }}
              >
                <DirectionsRunIcon />
              </IconButton>
            </Tooltip>
          );
        },
      },
    },
  ];

  const options = {
    rowsPerPage: 50,
    rowsPerPageOptions: [20, 50],
    searchAlwaysOpen: true,
    onRowsDelete: async (records, data) => {
      setIsLoading(true);
      showLoader();
      for (const [idx, value] of Object.entries(records.lookup)) {
        await deleteRecord(BULK_AUTOMATION, UUID, rows[idx]);
      }
      setRows(await getLocalItem(BULK_AUTOMATION));
      setIsLoading(false);
      hideLoader();
    },
    customToolbar: () => {
      return (
        <>
          <BulkAutomationAddDialog
            rows={rows}
            setRows={setRows}
            isloading={isLoading}
            setIsLoading={setIsLoading}
          />
          <Tooltip
            title={
              'Start Automation Process, do not interact with your browser while automation is running.'
            }
          >
            <IconButton onClick={() => startAutomationProcess()}>
              <DirectionsRunIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              'Stop automations from running.'
            }
          >
            <IconButton onClick={async () => {
              showLoader()
              const automations = await getLocalItem(BULK_AUTOMATION);
              automations.forEach(a => {
                // flagged to run
                if(a.active && !a.ranOn){
                  a.active = false;
                }
              })
              await setLocalItem(BULK_AUTOMATION, automations);
              hideLoader()
              processNotification({
                title: 'Automations Queuing Stopped',
                message:'Automations will stop running shortly',
                type:'info'}
              )
            }}>
              <CancelIcon />
            </IconButton>
          </Tooltip>

        </>
      );
    },
    setTableProps: () => {
      return {
        size: 'small',
      };
    },
    print: false,
    filter: false,
    download: false,
  };

  if (isLoading) {
    return <div></div>;
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!isLoading && (
        <MUIDataTable
          title={'Bulk Automation Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      )}
    </Box>
  );
}
