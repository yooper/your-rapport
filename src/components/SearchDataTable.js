
import * as React from 'react';
import Box from '@mui/material/Box';
import MUIDataTable from "mui-datatables";
import CopyToClipboardIcon from "./CopyToClipboardIcon";
import {hideLoader, showLoader} from "../utilities/loaders";
import {getLocalItem, setLocalItem} from "../models/db/local";
import {useState} from "react";
import SearchTableOptionMenu from "./menus/SearchTableOptionMenu";
import PreviewImageDialog from "./PreviewImageDialog";
import UploadDataDialog from "./dialogs/UploadDataDialog";

export default function SearchDataTable(props) {

  const [isLoading, setIsLoading] = useState(false);

  const columns = [
  {
    name: 'uuid',
    label: 'Uuid',
    options: {
      filter: false,
      sort: false,
      searchable: false,
      display: 'excluded'
    },
  },
  {
    name: 'screenshot',
    label: 'Screenshot',
    options: {
      filter: false,
      searchable: false,
      sort: true,
      customBodyRenderLite: (dataIndex) => {
        const record = props.rows[dataIndex]
        const [isOpen, setIsOpen] = useState(false)
        return (
            <>
            <img
                className={'clickable'}
                width="150"
                height="150"
                src={props.rows[dataIndex].screenshot}
                onClick={() => { setIsOpen(true); }}
            />
            <PreviewImageDialog record={record} isOpen={isOpen} setIsOpen={setIsOpen}/>
            </>
        )
      },
    },
  },
  {
    name: 'url',
    label: 'Url',
    options: {
      filter: false,
      sort: true,
      searchable: true,
      customBodyRenderLite: (dataIndex) => {
        let text = props.rows[dataIndex].url
        if (text.length > 64) {
          text = props.rows[dataIndex].url.substring(0, 32) + '...';
        }
        return <div>
          <a href={props.rows[dataIndex].url} target={'_blank'} rel={'noreferrer'} alt={props.rows[dataIndex].url} >{text}</a>
          <CopyToClipboardIcon record={props.rows[dataIndex]} copyFieldName={'url'}/>
        </div>;
      },
    },
  },
  {
    name: 'domain',
    label: 'Domain',
    options: {
      filter: true,
      sort: true,
      searchable: true
    },
  },
  {
    name: 'createdOn',
    label: 'Captured On',
    options: {
      filter: false,
      sort: true,
      searchable: false,
      customBodyRenderLite: (dataIndex) => {
        const date = new Date(parseInt(props.rows[dataIndex].createdOn));
        return <div>{date.toLocaleString()}</div>;
      },
    },
  },
  {
    name: 'text',
    label: 'Options',
    options: {
      print: false,
      filter: false,
      sort: true,
      searchable: true,
      customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          return <SearchTableOptionMenu record={record}/>
      },
    },
  }
  ]
  const getRecord = (rowData) => {
    let record = {}
    for(let idx=0; idx < columns.length; idx++)
    {
        record[columns[idx].name] = rowData[idx]
    }
    return record
  }

   const rowsDelete = async(records, data) => {
       setIsLoading(true)
       showLoader()
       const uuids = []
       for (const [idx, value] of Object.entries(records.lookup)) {
           uuids.push(props.rows[idx].uuid)
       }
      // deletes the rows in the ui and re-saves
      const deleteSet = new Set(uuids);
      const filteredResults =  props.rows.filter(record => !deleteSet.has(record.uuid));
      props.setRows(filteredResults);

      let screenshotRegistry = await getLocalItem('screenshots')
      screenshotRegistry.records = filteredResults;
      await setLocalItem('screenshots', screenshotRegistry);
      // update the configuration last
      let configurationRegistry = await getLocalItem('configuration') ?? {};
      configurationRegistry.lastSavedOn = Date.now().toString();
      configurationRegistry.recordCount = records.length;
      await setLocalItem('configuration', configurationRegistry);
       setIsLoading(false)
       hideLoader()
   }

  const options = {
    textLabels: {
        toolbar: {
            downloadCsv: 'Export as JSON file',
        },
    },
    onDownload: async(buildHead, buildBody, columns, data) => {
        let screenshotRegistry = await getLocalItem('screenshots')
        downloadJsonData(screenshotRegistry.records, 'your-rapport.json');
        return false
    },
    searchOpen: true,
    onRowsDelete: rowsDelete,
    rowsPerPage: 50,
    rowsPerPageOptions: [10, 15, 20, 50],
    setTableProps: () => {
        return {
            size: 'small',
        }
    },
    print: false,
    customToolbar: () => {
      return (
       <>
            <UploadDataDialog/>
       </>
        );
      },
  }


  if (props.isLoading) {
      return <div></div>
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!props.isLoading &&
        <MUIDataTable
          data={props.rows}
          columns={columns}
          options={options}
        />
      }
    </Box>
  );
}

