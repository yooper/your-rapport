import * as React from 'react';
import Box from '@mui/material/Box';
import MUIDataTable from 'mui-datatables';
import CopyToClipboardIcon from '../CopyToClipboardIcon';
import { createTab, hideLoader, showLoader } from '../../utilities/loaders';
import { deleteBulkRecords, getLocalItem } from '../../models/db/local';
import { useEffect, useState } from 'react';
import PreviewImageDialog from '../dialogs/PreviewImageDialog';
import UploadDataDialog from '../dialogs/UploadDataDialog';
import { downloadJsonData } from '../../utilities/transformers';
import NotesDialog from '../dialogs/NoteDialog';
import DiscoveryPluginDialog from '../dialogs/DiscoveryPluginDialog';
import { Badge, Tooltip } from '@mui/material';
import { Configuration } from '../../models/schemas/Configuration';
import SettingsIcon from '@mui/icons-material/Settings';

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
import { Artifact } from '../../models/schemas/Artifact';
import AddTagsFormDialog from '../dialogs/search_dashboard/AddTagsFormDialog';
import TagIcon from '@mui/icons-material/Tag';
import LanguageIcon from '@mui/icons-material/Language';
import { getIntegratedPlugins } from '../../services/discovery_plugin_services';
import JsonAttributeViewerDialog from '../dialogs/JsonAttributeViewerDialog';
import IconButton from '@mui/material/IconButton';
import AttachmentIcon from '@mui/icons-material/Attachment';
import GenericTableDialog from '../dialogs/GenericTableDialog';

export default function SearchDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectors, setSelectors] = useState(null);
  const [tags, setTags] = useState([]);
  const [discoveryPlugins, setDiscoveryPlugins] = useState(null);
  const [updatedOn, setUpdatedOn] = useState(null)
  const attachmentHeaders = ['uuid', 'mimeType', 'size', 'url', 'view']


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
      const screenshots = (await getLocalItem(RAPPORT)) ?? [];
      const elapsed = performance.now() - start;
      debug(`Finished after ${Math.max(elapsed).toFixed(0)}ms`);
      setRows(screenshots);
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
      const lastModified = await Configuration.getConfigurationValue(UPDATED_ON);
      if (updatedOn !== lastModified) {
        setUpdatedOn(lastModified)
        showLoader()
        const screenshots = (await getLocalItem(RAPPORT)) ?? [];
        setRows(screenshots);
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
          const [openAddTagDialog, setOpenAddTagDialog] = useState(false);
          const [openAttributeViewer, setOpenAttributeViewer] = useState(false);
          const mhtmlAttachment = record.artifacts.find(a => a.mimeType === 'multipart/related')
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
                    <Tooltip title={'Add or modify tags'}>
                      <IconButton>
                        <TagIcon
                          onClick={() => {
                            setOpenAddTagDialog(true);
                          }}
                        />
                      </IconButton>
                    </Tooltip>
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
                  <Badge badgeContent={record.artifacts.length} color={'primary'} >
                    <Tooltip title={'See the attachments'}>
                      <IconButton disabled={record.artifacts.length===0}>
                        <GenericTableDialog
                          title={'Associated Attachments'}
                          iconType={'AttachmentIcon'}
                          defaultHeaders={attachmentHeaders}
                          defaultRecords={record.artifacts.map(a => {
                            return {
                              ...a,
                              'view': `chrome-extension://${chrome.runtime.id}/api.html?format=file&uuid=${a.uuid}`
                            }
                          })}
                        />
                      </IconButton>
                    </Tooltip>
                  </Badge>
                  <Badge>
                    <Tooltip
                      title={'Download the mhtml file for this Rapport.'}
                    >
                      <IconButton disabled={!Boolean(mhtmlAttachment)}>
                        <LanguageIcon
                          onClick={() => {
                            if (record.artifacts.length > 0) {

                              Artifact.downloadArtifact(mhtmlAttachment,`your.rapport.artifact.${mhtmlAttachment.uuid}.mhtml`
                              );
                            } else {
                              createTab(
                                'https://github.com/yooper/your-rapport/issues/16'
                              );
                              debug(
                                'Mhtml file not available for download when auto scroll capture is run.'
                              );
                            }
                          }}
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
              <AddTagsFormDialog
                isOpen={openAddTagDialog}
                setIsOpen={setOpenAddTagDialog}
                record={record}
                rows={rows}
                setRows={setRows}
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
                  <NotesDialog record={record} rows={rows} setRows={setRows} />
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
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          return value?.map((tag, index) => (
            <DiscoveryPluginDialog
              key={`tag-${tag.name}-${record.uuid}`}
              plugins={[]}
              title={'tag'}
              record={record}
              uxType={'chip'}
              selectorValue={tag.name}
              refreshRows={refreshRows}
            />
          ));
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
              selectorValue={selector.name}
              refreshRows={refreshRows}
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
          const record = getRecord(tableMeta.rowData);

          return (
            <DiscoveryPluginDialog
              key={`domain-${value}-${record.uuid}`}
              plugins={discoveryPlugins.filter((plugin) => {
                return plugin.pluginType === 'domain';
              })}
              title={'domain'}
              record={record}
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
          const plugins = getIntegratedPlugins().filter(p => p.pluginType === 'content').concat(discoveryPlugins.filter(p => p.pluginType === 'content'));
          return (
            <DiscoveryPluginDialog
              key={`content-${value}-${record.uuid}`}
              plugins={plugins}
              title={'content'}
              record={record}
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
      deleteRecords.push(rows[idx]);
    }

    await db.artifact.bulkDelete(deleteArtifacts);
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
