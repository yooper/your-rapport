import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import { deleteRecord, getLocalItem, updateRecord } from '../../models/db/local';
import { createTab, getActiveTab, hideLoader, processNotification, showLoader } from '../../utilities/loaders';
import BulkAutomationAddDialog from '../dialogs/automations/BulkAutomationAddDialog';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import IconButton from '@mui/material/IconButton';
import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import HelperPopover from '../HelperPopover';

export default function BulkAutomationTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function sendAutomationMessage(record) {
    try{
      chrome.runtime.sendMessage({ cmd: 'bulkAutomationUrl', automation: record });
      return true;
    }
    catch(e){
      return false;
    }

  }
  /**
   * Initiate the process of bulk downloading the list of urls
   * @param records
   */
  async function startAutomationProcess() {
    if(rows.length === 0){
      processNotification({title: 'No Bulk Urls', message: 'No urls have been supplied for auto downloading', type: 'info'});
      return;
    }

    if(!await sendAutomationMessage(rows[0])){
      processNotification({title: 'Bulk Process Error', message: 'Bulk processing is not working.', type: 'error'});
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
      const records = (await getLocalItem('bulk_automation')) ?? [];
      setRows(records);
      setIsLoading(false);
      hideLoader();
    }
    fetchData();
  }, []);


  const columns = [
    {
      name: 'uuid',
      label: 'Uuid',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    { label: 'Url', name: 'url' },
    { label: 'Unit', name: 'unit' },
    { label: 'Value', name: 'value' },
    { label: 'Items Collected', name: 'screenShotsCollected' },
    {
      label: 'Keep Open',
      name: 'closeTabAfterwards',
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
                    <HelperPopover message={'After the collection process has completed do you want the tab left open?'} />
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
      label: 'Options',
      name: 'options',
      options: {
        display: true,
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          return (
          <Tooltip
            title={
              'Re run the automation on this url'
            }
          >
            <IconButton onClick={async () => {
              record.ranOn = null;
              record.completedOn = null;
              await updateRecord('bulk_automation', 'uuid', record);
              if(!await sendAutomationMessage(record)){
                processNotification({title: 'Bulk Process Error', message: 'Bulk processing is not working.', type: 'error'});
              }
            }}>
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
    record.closeTabAfterwards = isChecked;
    await updateRecord('bulk_automation', 'uuid', record);
    processNotification({title: 'Bulk Collection Updated', message: `Bulk Collection ${record.url} has been updated.`, type: 'success'});
  };

  const options = {
    searchAlwaysOpen: true,
    onRowsDelete: async (records, data) => {
      setIsLoading(true);
      showLoader();
      for (const [idx, value] of Object.entries(records.lookup)) {
        await deleteRecord('bulk_automation', 'uuid', rows[idx]);
      }
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
