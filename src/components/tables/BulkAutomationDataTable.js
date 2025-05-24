
import * as React from 'react';
import Box from '@mui/material/Box';
import {useEffect, useState} from "react";
import MUIDataTable from "mui-datatables";
import {deleteRecord, getLocalItem} from "../../models/db/local";
import {hideLoader, showLoader} from "../../utilities/loaders";
import {Selector} from "../../models/schemas/Selector";
import BulkAutomationAddDialog from "../dialogs/automations/BulkAutomationAddDialog";
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";


export default function BulkAutomationTable(props) {

  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

    function sendAutomationMessage(record) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ cmd: 'bulkAutomation', automation: record }, (response) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(response);
        });
      });
    }
    /**
     * Initiate the process of bulk downloading the list of urls
      * @param records
     */
  async function startBulkAutomationProcess(records){
    for(let i=0; i<records.length; i++) {
        try{
            const response = await sendAutomationMessage(records[i]);
            await deleteRecord('bulk_automation', 'uuid', records[i]);
            const filteredResults = rows.filter(r => r.uuid !== response.uuid);
            setRows(filteredResults);
        }
        catch(e){
            console.log(e);
        }

    }
  }

  useEffect(() =>
  {
      async function fetchData() {
          showLoader();
          setIsLoading(true)
          const records = await getLocalItem('bulk_automation') ?? [];
          setRows(records)
          setIsLoading(false)
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
          sort: false
        }
    },
    { label: 'Url', name: 'url'}
  ]

  const options = {
      searchAlwaysOpen: true,
      onRowsDelete: async(records, data) => {
           setIsLoading(true)
           showLoader()
           const keys = []
           for (const [idx, value] of Object.entries(records.lookup)) {
               keys.push(rows[idx].key);
               await Selector.delete(rows[idx]);
           }
          // deletes the rows in the ui and re-saves
          const deleteSet = new Set(keys);
          const filteredResults = rows.filter(record => !deleteSet.has(record.key));
          setRows(filteredResults);
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
                <Tooltip title={'Start Automation Process, do not interact with your browser while automation is running.'}>
                    <IconButton onClick={() => startBulkAutomationProcess(rows)}>
                       <DirectionsRunIcon />
                    </IconButton>
                </Tooltip>
            </>

        )
      },
      setTableProps: () => {
          return {
              size: 'small',
          }
      },
      print: false,
      filter: false,
      download: false
  }


  if (isLoading) {
      return <div></div>
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!isLoading &&
        <MUIDataTable
          title={'Bulk Automation Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      }
    </Box>
  );
}

