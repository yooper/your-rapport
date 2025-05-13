
import * as React from 'react';
import Box from '@mui/material/Box';
import {useEffect, useState} from "react";
import MUIDataTable from "mui-datatables";
import SelectorFormDialog from "../dialogs/SelectorFormDialog";
import {getLocalItem} from "../../models/db/local";
import {hideLoader, showLoader} from "../../utilities/loaders";
import {Selector} from "../../models/schemas/Selector";


export default function SelectorDataTable(props) {

  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() =>
  {
      async function fetchData() {
          showLoader();
          setIsLoading(true)
          const records = await getLocalItem('selectors') ?? [];
          setRows(records)
          setIsLoading(false)
          hideLoader();
      }
      fetchData();
  }, []);


  const columns = [
    { label: 'Selector', name: 'key'},
    { label: 'Selector Type', name: 'selectorTypeName'},
    {
        label: 'Description',
        name: 'description',
        options: {
          display: false,
          filter: false,
          sort: true,
          searchable: true
        },
    }
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
            <SelectorFormDialog
                rows={rows}
                setRows={setRows}
                isloading={isLoading}
                setIsLoading={setIsLoading}
            />
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
          title={'Selector Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      }
    </Box>
  );
}

