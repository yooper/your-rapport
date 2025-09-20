import * as React from 'react';
import Box from '@mui/material/Box';
import MUIDataTable from 'mui-datatables';
import CopyToClipboardIcon from '../CopyToClipboardIcon';
import { hideLoader, showLoader } from '../../utilities/loaders';
import { deleteBulkRecords, getLocalItem } from '../../models/db/local';
import { useEffect, useState } from 'react';
import SearchTableOptionMenu from '../menus/SearchTableOptionMenu';
import PreviewImageDialog from '../dialogs/PreviewImageDialog';
import UploadDataDialog from '../dialogs/UploadDataDialog';
import { downloadJsonData } from '../../utilities/transformers';
import NotesDialog from '../dialogs/NoteDialog';
import DiscoveryPluginDialog from '../dialogs/DiscoveryPluginDialog';
import { Tooltip } from '@mui/material';
import { Configuration } from '../../models/schemas/Configuration';
import { DISCOVERY_PLUGIN, RAPPORT, SELECTOR, UPDATED_ON, UUID } from '../../services/constants';
import SearchDataTableToolbarSelect from './customizations/SearchDataTableToolbarSelect';
import { debug } from '../../services/logger_services';
import { rapportDebounceSearchRender } from './customizations/RapportDebounceSearchRender';
import { db } from '../../models/db/dexieDb';

export default function SearchDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectors, setSelectors] = useState(null);
  const [tags, setTags] = useState([]);
  const [discoveryPlugins, setDiscoveryPlugins] = useState(null);

  useEffect(() => {
      async function fetchData() {
        showLoader();
        setIsLoading(true);
        const start = performance.now()
        setSelectors(await db.selector.toArray());
        setTags(await db.tag.toArray());
        setDiscoveryPlugins(await getLocalItem(DISCOVERY_PLUGIN) ?? []);
        const screenshots = await getLocalItem(RAPPORT) ?? [];
        const elapsed = performance.now() - start;
        debug(`Finished after ${Math.max(elapsed).toFixed(0)}ms`);
        setRows(screenshots);
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
      const pageCachedOn = localStorage.getItem(UPDATED_ON) ?? null;

      if(updatedOn != pageCachedOn){
        await fetchData(); // check for new data every 10 seconds.
        localStorage.setItem(UPDATED_ON, updatedOn);
      }
    }, 3000); // wait 5 seconds before re-renders
    return () => clearInterval(intervalId);
  }, []);


  const columns = [
    {
      name: 'screenshot',
      label: 'SCREENSHOT',
      options: {
        filter: false,
        searchable: false,
        sort: true,
        customBodyRenderLite: (dataIndex) => {
          const record = rows[dataIndex];
          const [isOpen, setIsOpen] = useState(false);
          return (
            <>
              <img
                className={'clickable'}
                width="175"
                height="125"
                src={rows[dataIndex].screenshot}
                onClick={() => {
                  setIsOpen(true);
                }}
              />
              <PreviewImageDialog
                record={record}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
              />
            </>
          );
        },
      },
    },
    {
      name: 'url',
      label: 'URL',
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

          return (
            <div>
              <span>
                <span>
                  <CopyToClipboardIcon record={record} copyFieldName={'url'} />
                </span>
                <Tooltip title={record.url}>
                  <span className={'page_title'}>Url: </span>
                  <a href={record.url} target={'_blank'} rel={'noreferrer'}>
                    {url}
                  </a>
                </Tooltip>
              </span>
              <div>
                <Tooltip title={record.title}>
                  <span>
                    <CopyToClipboardIcon
                      record={record}
                      copyFieldName={'title'}
                    />
                  </span>
                  <span className={'page_title'}>Title: </span>
                  <span>{title}</span>
                </Tooltip>
              </div>
              <div>
                <span>
                  <NotesDialog
                    record={record}
                    rows={rows}
                    setRows={setRows}
                  />
                </span>
                <span className={'page_title'}>Notes:</span>
                <span> {record.note ?? ''}</span>
              </div>
            </div>
          );
        },
      },
    },
    {
      name: 'tags',
      label: 'TAGS',
      options: {
        filterType: 'multiselect',
        filter: true,
        sort: false,
        filterOptions: {
          names: tags?.map((x) => x.name) ?? [],
          logic: (tags, filters) => {
            const tagsLabels = tags.map((s) => s.name);
            return !filters.some((filter) => tagsLabels.includes(filter));
          },
        },
        customBodyRender: (value, tableMeta, updateValue) => {
          const tags = value ?? [];
          const record = getRecord(tableMeta.rowData)

          return tags.map((tag, index) => (
              <DiscoveryPluginDialog
                  key={`tag-${tag}-${record.uuid}`}
                  plugins={[]}
                  title={'tag'}
                  record={record}
                  uxType={'chip'}
                  pluginValue={tag}
              />
          ))
        },
      },
    },
    {
      name: 'selectors',
      label: 'SELECTORS',
      options: {
        filterType: 'multiselect',
        filter: true,
        sort: false,
        filterOptions: {
          names: selectors?.map((x) => x.name) ?? [],
          logic: (selectors, filters) => {
            const selectorLabels = selectors.map((s) => s.name);
            return !filters.some((filter) => selectorLabels.includes(filter));
          },
        },
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          if (record.selectors?.length == 0) {
            return <div></div>;
          }
          // TODO add support for regex activated discovery plugins.
          return record.selectors.map((selector, index) => (
            <DiscoveryPluginDialog
              key={`selector-${selector.name}-${selector.selectorTypeName}-${record.uuid}`}
              plugins={discoveryPlugins.filter((plugin) => {
                return plugin.pluginType === selector.selectorTypeName;
              })}
              title={selector.selectorTypeName}
              record={record}
              uxType={'chip'}
              pluginValue={selector.name}
            />
          ));
        },
      },
    },
      {
        name: 'domain',
        label: 'DOMAINS',
        options: {
          filterType: 'multiselect',
          filter: true,
          sort: true,
          customBodyRender: (value, tableMeta, updateValue) => {
            const record = getRecord(tableMeta.rowData)

            return <DiscoveryPluginDialog
                key={`domain-${value}-${record.uuid}`}
                plugins={discoveryPlugins.filter((plugin) => {
                  return plugin.pluginType === 'domain';
                })}
                title={'domain'}
                record={record}
                uxType={'chip'}
                pluginValue={value}
            />
          }
        },
      },
    {
      name: 'createdOn',
      label: 'COLLECTED ON',
      options: {
        filter: false,
        sort: true,
        searchable: false,
        customBodyRenderLite: (dataIndex) => {
          const date = new Date(parseInt(rows[dataIndex].createdOn));
          return <div>{date.toLocaleString()}</div>;
        },
      },
    },
    {
      name: 'options',
      label: 'OPTIONS',
      options: {
        print: false,
        filter: false,
        sort: false,
        searchable: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          return <SearchTableOptionMenu record={record} rows={rows} setRows={setRows}/>;
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
    {
      name: UUID,
      label: 'UUID',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
  ].concat(
    [
      'updatedOn',
      'hash',
      'length',
      'attributes',
      'tags',
      'caseManagementUuid',
      'createdOnLocalTime',
    ].map((fieldName) => {
      return {
        name: fieldName,
        label: fieldName,
        options: {
          display: false,
          filter: false,
          sort: false,
          searchable: false,
        },
      };
    })
  );

  const getRecord = (rowData) => {
    let record = {};
    for (let idx = 0; idx < columns.length; idx++) {
      record[columns[idx].name] = rowData[idx];
    }
    return record;
  };

  const rowsDelete = async (records, data) => {
    setIsLoading(true);
    showLoader();
    const deleteRecords = [];
    for (const [idx, value] of Object.entries(records.lookup)) {
      deleteRecords.push(rows[idx])
    }

    await deleteBulkRecords(RAPPORT, UUID, deleteRecords);
    setRows(await getLocalItem(RAPPORT));
    // update the configuration last
    let configuration = Configuration.getConfiguration();
    configuration.screenShotCount = rows.length;
    await Configuration.setConfiguration(configuration);
    setIsLoading(false);
    hideLoader();
  };

  const options = {
    customSearchRender: rapportDebounceSearchRender(800),
    textLabels: {
      toolbar: {
        downloadCsv: 'Export as JSON file',
      },
    },
    onDownload: (buildHead, buildBody, columns, data) => {
        showLoader();
        getLocalItem(RAPPORT).then((rapports) => {
          downloadJsonData(rapports, 'your-rapport.json');
          hideLoader();
        });
      return false;
    },
    searchOpen: true,
    onRowsDelete: rowsDelete,
    rowsPerPage: 50,
    rowsPerPageOptions: [10, 15, 20, 50],
    setTableProps: () => {
      return {
        size: 'small',
      };
    },
    print: false,
    customSearch: (searchQuery, currentRow, columns) => {
      let isFound = false;
      columns.forEach((col, i) => {
        if (
          col.searchable &&
          currentRow[i] != null &&
          currentRow[i]
            .toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          isFound = true;
        }
      });
      return isFound;
    },
    customToolbar: () => {
      return (
        <>
          <UploadDataDialog isLoading={isLoading} setIsLoading={setIsLoading}/>
        </>
      );
    },
    customToolbarSelect: (selectedRows, displayData, setSelectedRows) => (
          <SearchDataTableToolbarSelect
              selectedRows={selectedRows}
              displayData={displayData}
              columns={columns}
              setSelectedRows={setSelectedRows}
              onRowsDelete={rowsDelete}
          />
      ),
  };

  if (isLoading) {
    return <div></div>;
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!isLoading && (
        <MUIDataTable data={rows} columns={columns} options={options} />
      )}
    </Box>
  );
}
