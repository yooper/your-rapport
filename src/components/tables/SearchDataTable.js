
import * as React from 'react';
import Box from '@mui/material/Box';
import MUIDataTable from "mui-datatables";
import CopyToClipboardIcon from "../CopyToClipboardIcon";
import {hideLoader, showLoader} from "../../utilities/loaders";
import {getLocalItem, setLocalItem} from "../../models/db/local";
import {useEffect, useState} from "react";
import SearchTableOptionMenu from "../menus/SearchTableOptionMenu";
import PreviewImageDialog from "../dialogs/PreviewImageDialog";
import UploadDataDialog from "../dialogs/UploadDataDialog";
import {downloadJsonData} from "../../utilities/transformers";
import NotesDialog from "../dialogs/NoteDialog";
import DiscoveryPluginDialog from "../dialogs/DiscoveryPluginDialog";

export default function SearchDataTable(props) {

  const [isLoading, setIsLoading] = useState(false);
  const [selectors, setSelectors] = useState([]);
  const [discoveryPlugins, setDiscoveryPlugins] = useState([]);

  useEffect(() =>
  {
      async function fetchData(){
          setSelectors(await getLocalItem('selectors') ?? []);
          setDiscoveryPlugins(await getLocalItem('discoveryPlugins') ?? []);
      }
      fetchData();
  }, []);
  const columns = [
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
                width="175"
                height="125"
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
      filter: true,
      sort: false,
      searchable: true,
      customBodyRender: (value, tableMeta, updateValue) => {
        const record = getRecord(tableMeta.rowData);
        let url = record.url;
        if (url.length > 32) {
          url = record.url.substring(0, 32) + '...';
        }

        let title = record.title;
        if (title.length > 40) {
          title = title.substring(0, 40) + '...';
        }

        return <div>
            <span>
                <span><CopyToClipboardIcon record={record} copyFieldName={'url'}/></span>
                <span className={'page_title'}>Url: </span><a href={record.url} target={'_blank'} rel={'noreferrer'} alt={record.url} >{url}</a>
            </span>
            <div>
                <span><CopyToClipboardIcon record={record} copyFieldName={'title'}/></span>
              <span className={'page_title'}>Title: </span><span>{title}</span>
            </div>
            <div>
                <span>
                      <NotesDialog record={record} rows={props.rows} setRows={props.setRows}/>
                </span>
                <span className={'page_title'}>Notes:</span><span> {record.note ?? ''}</span>
            </div>
        </div>
      },
    },
  },
  {
    name: 'selectors',
    label: 'Selectors',
    options: {
      filterType: 'multiselect',
      filter: true,
      filterOptions: {
        names: selectors?.map((x) => x.key) ?? []
      },
      sort: false,
      customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData)
          if(record?.selectors?.length == 0){
              return <div></div>
          }
          // add support for regexes.
          return record?.selectors?.map((selector, index) => (
              <DiscoveryPluginDialog
                  key={`selector-${selector.key}-${selector.selectorTypeName}-${record.uuid}`}
                  plugins={discoveryPlugins.filter( plugin => {
                      return plugin.pluginType === selector.selectorTypeName
                  })}
                  title={selector.selectorTypeName}
                  record={record}
                  uxType={'chip'}
                  pluginValue={selector.key}
              />
          ))
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
    label: 'Collected On',
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
    name: 'uuid',
    label: 'OPTIONS',
    options: {
      print: false,
      filter: false,
      sort: false,
      searchable: true,
      customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          return <SearchTableOptionMenu record={record}/>
      },
    },
  },
  {
      name: 'title',
      label: 'Title',
      options: {
          display: 'excluded',
          filter: false,
          sort: false,
      },
  },
  {
      name: 'text',
      label: 'Text',
      options: {
          display: 'excluded',
          filter: false,
          sort: false,
      },
  },
  {
      name: 'note',
      label: 'Note',
      options: {
          display: 'excluded',
          filter: false,
          sort: false,
      },
  },
  ].concat(['updatedOn','hash','length','attributes','tags','caseManagementUuid', 'createdOnLocalTime'].map(fieldName => {
      return {
            name: fieldName,
            label: fieldName,
            options: {
                display: false,
                filter: false,
                sort: false,
                searchable: false
            }
        }
  }))

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
      await setLocalItem('rapports', filteredResults);
      // update the configuration last
      let configurationRegistry = await getLocalItem('configuration') ?? {};
      configurationRegistry.lastSavedOn = Date.now().toString();
      configurationRegistry.screenShotCount = filteredResults.length;
      await setLocalItem('configuration', configurationRegistry);
      setIsLoading(false)
      hideLoader();
   }

  const options = {
    textLabels: {
        toolbar: {
            downloadCsv: 'Export as JSON file',
        },
    },
    onDownload: (buildHead, buildBody, columns, data) => {
        getLocalItem('rapports').then(rapports => {
            downloadJsonData(rapports, 'your-rapport.json');
        })
        return false;
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
    customSearch: (searchQuery, currentRow, columns) => {
        let isFound = false
        columns.forEach((col, i) => {
            if (col.searchable && currentRow[i] != null && currentRow[i].toString().toLowerCase().includes(searchQuery.toLowerCase())) {
                isFound = true;
            }
        });
        return isFound;
    },
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

