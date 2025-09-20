import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import { hideLoader, showLoader } from '../../utilities/loaders';
import { db } from '../../models/db/dexieDb';
import { Tag } from '@mui/icons-material';
import TagFormDialog from '../dialogs/TagFormDialog';

export default function TagDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      const records = await db.tag.toArray();
      setRows(records);
      setIsLoading(false);
      hideLoader();
    }
    fetchData();

  }, []);

  const columns = [
    { label: 'Tag Name', name: 'name' }
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

      await Tag.delete(names)
      setRows(await db.tag.toArray());
      setIsLoading(false);
      hideLoader();
    },
    customToolbar: () => {
      return (
        <TagFormDialog
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
