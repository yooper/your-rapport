
import * as React from 'react';
import Box from '@mui/material/Box';
import {useEffect, useState, Fragment} from "react";
import MUIDataTable from "mui-datatables";
import {FormControlLabel, Switch} from "@mui/material";
import {deleteRecord, getLocalItem, updateRecord} from "../../models/db/local";
import {hideLoader, processNotification, showLoader} from "../../utilities/loaders";
import {Selector} from "../../models/schemas/Selector";
import HelperPopover from "../HelperPopover";
import IconButton from "@mui/material/IconButton";

export default function DiscoveryPluginDataTable() {

  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pluginTypes, setPluginTypes] = useState([])
  const basePluginTypes = [
      'address',
      'application',
      'associate',
      'bitcoin',
      'content',
      'date',
      'dob',
      'domain',
      'email',
      'ethereum',
      'event',
      'family',
      'keyword',
      'name',
      'occupation',
      'organization',
      'phone',
      'religion',
      'tag',
      'username'
  ]

  useEffect(() =>
  {
      async function fetchData() {
          setIsLoading(true)
          setRows(await getLocalItem('discovery-plugins') ?? []);
          let allPluginTypes = [...new Set( [...basePluginTypes])];
          allPluginTypes.sort();
          setPluginTypes(allPluginTypes);
          setIsLoading(false);
          hideLoader();
      }
      fetchData();
  }, []);

  const handleSwitchChange = async(record, isChecked) => {
    record.active = isChecked
    await updateRecord('discovery-plugins', 'uuid', record);
    // TODO: fix layout issue
    //processNotification({title: 'Discovery Plugin Updated', message: `Discovery Plugin ${record.label} has been updated.`, type: 'success'});
  }

  const getRecord = (rowData) =>
  {
    let record = {}
    for(let idx=0; idx < columns.length; idx++)
    {
        record[columns[idx].name] = rowData[idx]
    }
    return record
  }

  const columns = [
      {
        name: 'uuid',
        label: 'Uuid',
        options: {
            display: false,
            filter: false,
            sort: false
        }
      },
      {
        label: 'Active',
        name: 'active',
        options: {
          display: true,
          filter: false,
          sort: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            if (value === undefined) {
              return <div></div>;
            }
            const record = getRecord(tableMeta.rowData)
            return (
              <FormControlLabel
                control={<Switch color="primary" color="primary" checked={value} />}
                label={
                    <div><IconButton><HelperPopover message={record.description} /></IconButton></div>
                }
                onChange={ (event) => {
                    updateValue(event.target.checked)
                    handleSwitchChange(record,event.target.checked)
                }}
              />
            );
          },
        },
      },
      { label: 'Label', name: 'label'},
      {
        name: 'url',
        label: 'Url ',
        options: {
            filter: false,
            sort: false,
            customBodyRender: (value, tableMeta, updateValue) => {
            if (value === undefined) {
              return <div></div>;
            }

            let text = value
            if (value.length > 32) {
              text = value.substring(0, 32) + '...';
            }

            return (
              <span>{text}</span>
            )
          },
        },
    },
      {
        name: 'groupName',
        label: 'Group Name',
        options: {
            display: false,
            filter: true,
            sort: false
        }
      },
      {
        name: 'action',
        label: 'Action',
        options: {
            display: true,
            filter: true,
            sort: false
        }
      },
      {
        name: 'method',
        label: 'Http Method',
        options: {
            display: 'excluded',
            filter: false,
            sort: false
        }
      },
      {
        name: 'contentTypeHeader',
        label: 'Content Type Header',
        options: {
            display: 'excluded',
            filter: false,
            sort: false
        }
      },
      {
        name: 'fieldMapping',
        label: 'Field Mappings',
        options: {
            display: 'excluded',
            filter: false,
            sort: false
        }
      },
      {
        name: 'headers',
        label: 'Headers',
        options: {
            display: 'excluded',
            filter: false,
            sort: false
        }
      },
      {
        name: 'pluginType',
        label: 'Plugin Type',
        options: {
            display: true,
            filter: true,
            sort: false
        }
      },
      {
        name: 'regex',
        label: 'Regex',
        options: {
            display: 'excluded',
            filter: false,
            sort: false
        }
      },
      {
        name: 'country',
        label: 'Country',
        options: {
            display: false,
            filter: true,
            sort: false
        }
      },
      {
        name: 'description',
        label: 'Description',
        options: {
            display: false,
            filter: false,
            sort: false
        }
      },
      {
        name: 'homePage',
        label: 'Home Page',
        options: {
            display: false,
            filter: false,
            sort: false
        }
      },
      {
        name: 'version',
        label: 'Version',
        options: {
            display: true,
            filter: false,
            sort: false
        }
      }
  ]


  const options = {
      searchAlwaysOpen: true,
      onRowsDelete: async(records, data) => {
        setIsLoading(true)
        showLoader()
        const keys = []
        for (const [idx, value] of Object.entries(records.lookup)) {
           await deleteRecord('discovery-plugins', 'uuid', rows[idx])
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
            <Fragment>
            </Fragment>
        )
      },

      rowsPerPage: 25,
      rowsPerPageOptions: [10, 25, 50, 100],
      setTableProps: () => {
          return {
              size: 'small',
          }
      },
      print: false,
      download: false,
  }

  if (isLoading) {
    return <div></div>;
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!isLoading &&
        <MUIDataTable
          title={'Discovery Plugin Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      }
    </Box>
  );
}

