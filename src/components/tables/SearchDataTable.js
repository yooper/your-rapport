import * as React from 'react';
import Box from '@mui/material/Box';
import MUIDataTable from 'mui-datatables';
import CopyToClipboardIcon from '../CopyToClipboardIcon';
import { hideLoader, showLoader } from '../../utilities/loaders';
import { deleteBulkRecords, getLocalItem } from '../../models/db/local';
import { useEffect, useState } from 'react';
import PreviewImageDialog from '../dialogs/PreviewImageDialog';
import UploadDataDialog from '../dialogs/UploadDataDialog';
import { downloadJsonData, getUtcNow } from '../../utilities/transformers';
import NotesDialog from '../dialogs/NoteDialog';
import DiscoveryPluginDialog from '../dialogs/DiscoveryPluginDialog';
import { Avatar, Badge, Tooltip } from '@mui/material';
import { Configuration } from '../../models/schemas/Configuration';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  RAPPORT,
  UPDATED_ON,
  UUID,
} from '../../services/constants';
import SearchDataTableToolbarSelect from './customizations/SearchDataTableToolbarSelect';
import { debug } from '../../services/logger_services';
import { rapportDebounceSearchRender } from './customizations/RapportDebounceSearchRender';
import { db } from '../../models/db/dexieDb';
import VerticalGenericTableDialog from '../dialogs/VerticalGenericTableDialog';
import AddTagsFormDialog from '../dialogs/search_dashboard/AddTagsFormDialog';
import { getIntegratedPlugins } from '../../services/discovery_plugin_services';
import JsonAttributeViewerDialog from '../dialogs/JsonAttributeViewerDialog';
import IconButton from '@mui/material/IconButton';
import AttachmentIcon from '@mui/icons-material/Attachment';
import GenericTableDialog from '../dialogs/GenericTableDialog';
import SelectorFormDialogV2 from '../dialogs/SelectorFormDialogV2';

export default function SearchDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectors, setSelectors] = useState(null);
  const [tags, setTags] = useState([]);
  const [discoveryPlugins, setDiscoveryPlugins] = useState(null);
  let lastModified = localStorage.getItem('lastModified') ? parseInt(localStorage.getItem('lastModified')) : getUtcNow();
  const attachmentHeaders = ['view', 'uuid', 'mimeType', 'size', 'url']


  /**
   * Load all the data into the UI
   * @returns {Promise<void>}
   */
  const fetchData = async () => {
      showLoader();
      setIsLoading(true);
      const start = performance.now();
      setSelectors(await db.selector.toArray());
      setTags(await db.tag.toArray());
      setDiscoveryPlugins((await db.discoveryPlugin.toArray()) ?? []);
      const rapports = await db.rapport.orderBy('updatedOn').reverse().toArray();
      const elapsed = performance.now() - start;
      debug(`Finished after ${Math.max(elapsed).toFixed(0)}ms`);
      setRows(rapports);
      setIsLoading(false);
      hideLoader();
    }

  useEffect(() => {
    fetchData();

    /**
     * Check if any updates occurred
     * @type {number}
     */
    const intervalId = setInterval(async () => {
      const configuration = await Configuration.getConfiguration();
      if (lastModified < configuration.updatedOn) {
        lastModified = configuration.updatedOn;
        showLoader()
        const rapports = await db.rapport.toArray();
        setRows(rapports);
        hideLoader()
      }
    }, 5000); // wait 5 seconds before re-renders
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Wrapper around fetch data, meant to be passed into other components
   * @returns {Promise<void>}
   */
  const refreshRows = async() =>{
    fetchData();
  }

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
          const [openAttributeViewer, setOpenAttributeViewer] = useState(false);
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
              <div>
                <Box>
                  <Badge badgeContent={0} color={'primary'}>
                    <IconButton>
                    <VerticalGenericTableDialog
                      selectedRecord={record}
                      title={`Data Integrity Attributes`}
                      iconType={'InfoOutlinedIcon'}
                      approvedFields={[
                        'url',
                        'domain',
                        'hash',
                        'hashAlgorithm',
                        'createdBy',
                        'createdOn',
                        'updatedBy',
                        'updatedOn',
                        'size',
                      ]}
                    />
                    </IconButton>
                  </Badge>

                  <Badge>
                    <Tooltip title={'View the attributes of this capture.'}>
                      <IconButton>
                      <SettingsIcon
                        onClick={() => {
                          setOpenAttributeViewer(true);
                        }}
                      />
                      </IconButton>
                    </Tooltip>
                  </Badge>
                  <Badge badgeContent={record.artifacts?.length ?? 0} color={'primary'} >
                    <Tooltip title={'See the attachments'}>
                      <IconButton disabled={record.artifacts?.length===0}>
                        <GenericTableDialog
                          title={'Associated Attachments'}
                          iconType={'AttachmentIcon'}
                          defaultHeaders={attachmentHeaders}
                          defaultRecords={record.artifacts?.map(a => {
                            return {
                              ...a,
                              'view': `chrome-extension://${chrome.runtime.id}/api.html?format=file&uuid=${a.uuid}`
                            }
                          })}
                        />
                      </IconButton>
                    </Tooltip>
                  </Badge>
                </Box>
              </div>
              <PreviewImageDialog
                record={record}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
              />
              <JsonAttributeViewerDialog
                isOpen={openAttributeViewer}
                setIsOpen={setOpenAttributeViewer}
                record={record}
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
        filter: false,
        sort: false,
        searchable: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          let url = record.url ?? 'RECORD IS MALFORMED (DELETE IT)';
          if (url.length > 32) {
            url = record.url.substring(0, 32) + '...';
          }

          let title = record.title ?? 'RECORD IS MALFORMED (DELETE IT)';
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
                  <NotesDialog record={record} refreshRows={refreshRows} />
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
            const tagsLabels = tags?.map((s) => s.name);
            return !filters.some((filter) => tagsLabels.includes(filter));
          },
        },
        customBodyRenderLite: (dataIndex) => {
          const record = rows[dataIndex];
          const [open, setOpen] = useState(false);

          const chips = record.tags?.map((tag, index) => (
            <DiscoveryPluginDialog
              key={`tag-${tag.name}-${record.uuid}`}
              plugins={[]}
              title={'tag'}
              rapport={record}
              uxType={'chip'}
              selectorValue={tag.name}
              refreshRows={refreshRows}
            />
          ));

          return (
            <>
              <Tooltip title={'Add tags to your rapport'}>
                <IconButton onClick={() => { setOpen(true)}}>
                  <AddCircleOutlineIcon color={'primary'}/>
                </IconButton>
              </Tooltip>
              {chips}
              <AddTagsFormDialog
                isOpen={open}
                setIsOpen={setOpen}
                record={record}
                refreshRows={refreshRows}
              />
            </>
          )

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
        customBodyRenderLite: (dataIndex) => {
          const record = rows[dataIndex];
          const [open, setOpen] = useState(false);

          if (record.selectors?.length == 0) {
            return (
            <Tooltip title={'Add a new selector'}>
              <IconButton onClick={() => { setOpen(true)}}>
                <AddCircleOutlineIcon color={'primary'}/>
                <SelectorFormDialogV2
                  open={open}
                  setOpen={setOpen}
                  isloading={isLoading}
                  setIsLoading={setIsLoading}
                  refreshRows={refreshRows}
                />
              </IconButton>
            </Tooltip>
            )
          }
          // TODO add support for regex activated discovery plugins.
          const chips = record.selectors?.map((selector, index) => (
            <DiscoveryPluginDialog
              key={`selector-${selector.name}-${selector.selectorTypeName}-${record.uuid}`}
              plugins={discoveryPlugins.filter((plugin) => {
                return plugin.pluginType === selector.selectorTypeName;
              })}
              title={selector.selectorTypeName ?? ''}
              rapport={record}
              uxType={'chip'}
              selectorValue={selector.name}
              refreshRows={refreshRows}
            />
          ));
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
              {chips}
              <SelectorFormDialogV2
                open={open}
                setOpen={setOpen}
                isloading={isLoading}
                setIsLoading={setIsLoading}
                refreshRows={refreshRows}
              />
            </>
          )
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
          const record = getRecord(tableMeta.rowData);

          return (
            <DiscoveryPluginDialog
              key={`domain-${value}-${record.uuid}`}
              plugins={discoveryPlugins.filter((plugin) => {
                return plugin.pluginType === 'domain';
              })}
              title={'domain'}
              rapport={record}
              uxType={'chip'}
              selectorValue={value}
              refreshRows={refreshRows}
            />
          );
        },
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
          const date = new Date(parseInt(rows[dataIndex].createdOn) * 1000);
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
          const plugins = getIntegratedPlugins().filter(p => p.pluginType === 'content').concat(discoveryPlugins.filter(p => p.pluginType === 'content'));
          return (
            <DiscoveryPluginDialog
              key={`content-${value}-${record.uuid}`}
              plugins={plugins}
              title={'content'}
              rapport={record}
              uxType={'appsIcon'}
              pluginValue={''}
              refreshRows={refreshRows}
            />
          );
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
      name: 'artifacts',
      label: 'ARTIFACTS',
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
        label: fieldName.toUpperCase(),
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
    const deleteArtifacts = [];
    for (const [idx, value] of Object.entries(records.lookup)) {
      deleteArtifacts.push(rows[idx].artifacts.map((a) => a.uuid));
      deleteRecords.push(rows[idx].uuid);
    }

    await db.artifact.bulkDelete(deleteArtifacts);
    await db.rapport.bulkDelete(deleteRecords);
    setRows(await db.rapport.toArray());
    // update the configuration last
    let configuration = await Configuration.getConfiguration();
    configuration.screenShotCount = rows.length;
    configuration.updatedOn = getUtcNow();
    lastModified = getUtcNow();
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
      db.rapport.toArray().then((rapports) => {
        // set artifacts to an empty array,
        // TODO: support exporting artifacts
        rapports.forEach(r => r.artifacts = []);
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
          <UploadDataDialog isLoading={isLoading} setIsLoading={setIsLoading} dataType={'rapports'}/>
        </>
      );
    },
    customToolbarSelect: (selectedRows, displayData, setSelectedRows) => (
      <SearchDataTableToolbarSelect
        selectedRows={selectedRows}
        displayData={displayData}
        columns={columns}
        setSelectedRows={setSelectedRows}
        rows={rows}
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
