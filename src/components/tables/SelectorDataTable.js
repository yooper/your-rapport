import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import { hideLoader, showLoader } from '../../utilities/loaders';
import {
  SELECTOR,
  UPDATED_ON,
} from '../../services/constants';
import { Configuration } from '../../models/schemas/Configuration';
import { db } from '../../models/db/dexieDb';
import { Selector } from '../../models/schemas/Selector';
import { Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SelectorFormDialogV2 from '../dialogs/SelectorFormDialogV2';
import { getUtcNow } from '../../utilities/transformers';

export default function SelectorDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {

    fetchData();
    /**
     * Check if any updates occurred
     * @type {number}
     */
    const intervalId = setInterval(async () => {
      const configuration = await Configuration.getConfiguration();
      const pageCachedOn = localStorage.getItem(SELECTOR) ?? getUtcNow();
      if (configuration.updatedOn != pageCachedOn) {
        await fetchData(); // check for new data every 10 seconds.
        localStorage.setItem(SELECTOR, String(configuration.updatedOn));
      }
    }, 10000); // wait 10 seconds before re-renders
    return () => clearInterval(intervalId);
  }, []);

  async function fetchData() {
    showLoader();
    setIsLoading(true);
    const records = await db.selector.toArray();
    setRows(records);
    setIsLoading(false);
    hideLoader();
  }


  const columns = [
    {
      label: 'Active',
      name: 'Active',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
        searchable: false,
      },
    },
    { label: 'Selector', name: 'name' },
    { label: 'Selector Type', name: 'selectorTypeName' },
    {
      label: 'Description',
      name: 'description',
      options: {
        display: false,
        filter: false,
        sort: true,
        searchable: true,
      },
    },
  ];

  const options = {
    searchAlwaysOpen: false,
    onRowsDelete: async (records, data) => {
      setIsLoading(true);
      showLoader();
      const names = [];
      for (const [idx, value] of Object.entries(records.lookup)) {
        names.push(rows[idx].name);
      }

      await Selector.delete(names);
      await fetchData()
    },
    customToolbar: () => {
      return (
        <>
        <Tooltip title={'Add a new selector'}>
          <IconButton onClick={() =>{
            setOpen(true)
          }}>
            <AddCircleOutlineIcon
              color={'primary'}
            />
          </IconButton>
        </Tooltip>
        <SelectorFormDialogV2
          open={open}
          setOpen={setOpen}
          isloading={isLoading}
          setIsLoading={setIsLoading}
          refreshRows={fetchData}
        />
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
          title={'Selector Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      )}
    </Box>
  );
}
