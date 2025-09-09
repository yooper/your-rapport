import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import SelectorFormDialog from '../dialogs/SelectorFormDialog';
import { getLocalItem } from '../../models/db/local';
import { hideLoader, showLoader } from '../../utilities/loaders';
import { BULK_AUTOMATION, RAPPORT, SELECTOR, UPDATED_ON } from '../../services/constants';
import { Configuration } from '../../models/schemas/Configuration';
import { db } from '../../models/db/dexieDb';

export default function SelectorDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      const records = await db.selectors.toArray();
      setRows(records);
      setIsLoading(false);
      hideLoader();
    }
    fetchData();
    /**
     * Check if any updates occurred
     * @type {number}
     */
    const intervalId = setInterval(async () => {

      let updatedOn = await Configuration.getConfigurationValue(UPDATED_ON)
      const pageCachedOn = localStorage.getItem(SELECTOR) ?? null;

      if(updatedOn !== pageCachedOn){
        await fetchData(); // check for new data every 10 seconds.
        localStorage.setItem(UPDATED_ON, updatedOn);
        localStorage.setItem(SELECTOR, updatedOn);
      }
    }, 10000); // wait 10 seconds before re-renders
    return () => clearInterval(intervalId);

  }, []);

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
    { label: 'Selector', name: 'key' },
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
    searchAlwaysOpen: true,
    onRowsDelete: async (records, data) => {
      setIsLoading(true);
      showLoader();
      const keys = [];
      for (const [idx, value] of Object.entries(records.lookup)) {
        keys.push(rows[idx].key);
        await db.selectors.bulkDelete(keys);
      }
      setRows(await db.selectors.toArray());
      setIsLoading(false);
      hideLoader();
    },
    customToolbar: () => {
      return (
        <SelectorFormDialog
          rows={rows}
          setRows={setRows}
          isloading={isLoading}
          setIsLoading={setIsLoading}
        />
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
