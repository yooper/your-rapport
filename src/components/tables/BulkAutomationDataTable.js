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
import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import HelperPopover from '../HelperPopover';
import {
  BULK_AUTOMATION,
  PROCESS_QUEUE_AUTOMATION_URLS,
  RAPPORT,
  UUID,
} from '../../services/constants';
import { Configuration } from '../../models/schemas/Configuration';
import { debug } from '../../services/logger_services';
import BulkAutomationUrl from '../../models/schemas/BulkAutomationUrl';

export default function BulkAutomationTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  let port = chrome.runtime.connect({ name: RAPPORT });

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
    if (rows.length === 0) {
      processNotification({title:'No Bulk Automations', message:'Enter some web site urls in order to collect them', type:'info'})
      return;
    }
    await Configuration.setConfigurationValue(
      'automationBulkCollectionModel',
      true
    );
    let retry = 0;
    let success = false;
    do{
      try{
        port.postMessage({ cmd: PROCESS_QUEUE_AUTOMATION_URLS });
        success = true;
        return;
      }
      catch(e){
        debug(String(e), { cmd: PROCESS_QUEUE_AUTOMATION_URLS, method: 'startAutomationProcess' })
        // reconnect
        //port = chrome.runtime.connect({ name: RAPPORT });
      }
      finally {
        retry++;
      }
    }
    while(!success && retry < 3);
    if(retry > 3) {
      debug('Failed to start automation process', { method: 'startAutomationProcess' })
    }
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
      label: 'Uuid',
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
    { label: 'Unit', name: 'unit' },
    { label: 'Value', name: 'value' },
    { label: '# Screenshots', name: 'screenShotsCollected' },
    {
      label: 'Keep Tab Open',
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
                <Switch color="primary" color="primary" checked={value} />
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
              onChange={(event) => {
                updateValue(event.target.checked);
                handleSwitchChange(record, event.target.checked);
              }}
            />
          );
        },
      },
    },
    {
      name: 'ranOn',
      label: 'Ran On',
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
      label: 'Completed',
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
      label: 'Info',
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
      label: 'Options',
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
                  record.ranOn = null;
                  record.completedOn = null;
                  const automationQueue =
                    (await updateRecord(BULK_AUTOMATION, UUID, record)) ?? [];
                  automationQueue.forEach((a) => (a.active = false));
                  const automation = automationQueue.find(
                    (a) => a.uuid === record.uuid
                  );
                  automation.active = true;
                  automation.ranOn = null;
                  automation.description = 'User Restarted Automation';
                  processNotification({
                    title: 'Restarting Automation',
                    message:
                      "Automation job is restarting. Don't Spam the button.",
                    type: 'success',
                  });
                  // only the active automation is run, bulk automation must be off
                  await Configuration.setConfigurationValue(
                    'automationBulkCollectionModel',
                    false
                  );
                  // sync to storage
                  await setLocalItem(BULK_AUTOMATION, automationQueue);
                  let retry = 0;
                  do{
                    try{
                      port.postMessage({ cmd: PROCESS_QUEUE_AUTOMATION_URLS });
                      return;
                    }
                    catch(e){
                      debug(String(e), { cmd: PROCESS_QUEUE_AUTOMATION_URLS, method: 'customBodyRender' })
                    }
                    finally {
                      retry++;
                      // reconnect
                      port = chrome.runtime.connect({ name: RAPPORT });
                    }
                  }
                  while(retry < 3);
                  if(retry > 3){
                    processNotification({title: 'Failed Automation', message: 'Refresh this page to start the automations, '})
                  }
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

  /**
   *
   * @param {BulkAutomationUrl} record
   * @param {boolean} isChecked
   * @returns {Promise<void>}
   */
  const handleSwitchChange = async (record, isChecked) => {
    record.keepTabOpen = isChecked;
    await updateRecord(BULK_AUTOMATION, UUID, record);
  };

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
