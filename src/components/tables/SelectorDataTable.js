import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import SelectorFormDialog from '../dialogs/SelectorFormDialog';
import { hideLoader, showLoader } from '../../utilities/loaders';
import {
  SELECTOR,
  UPDATED_ON,
} from '../../services/constants';
import { Configuration } from '../../models/schemas/Configuration';
import { db } from '../../models/db/dexieDb';
import { Selector } from '../../models/schemas/Selector';

export default function SelectorDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      const records = await db.selector.toArray();
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
      let updatedOn = await Configuration.getConfigurationValue(UPDATED_ON);
      const pageCachedOn = localStorage.getItem(SELECTOR) ?? null;

      if (updatedOn !== pageCachedOn) {
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
      setRows(await db.selector.toArray());
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
