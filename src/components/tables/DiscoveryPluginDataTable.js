import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState, Fragment } from 'react';
import MUIDataTable from 'mui-datatables';
import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import {
  hideLoader,
  processNotification,
  showLoader,
} from '../../utilities/loaders';
import HelperPopover from '../HelperPopover';
import IconButton from '@mui/material/IconButton';
import { UUID } from '../../services/constants';
import DiscoveryPluginFormDialog from '../dialogs/DiscoveryPluginFormDialog';
import { db } from '../../models/db/dexieDb';
import { CloudDownload } from '@mui/icons-material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';
import { downloadJsonData } from '../../utilities/transformers';
import UploadDataDialog from '../dialogs/UploadDataDialog';

export default function DiscoveryPluginDataTable() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pluginTypes, setPluginTypes] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
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
    'username',
  ];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setRows(await db.discoveryPlugin.toArray());
      let allPluginTypes = [...new Set([...basePluginTypes])];
      allPluginTypes.sort();
      setPluginTypes(allPluginTypes);
      // only make the key name available, we don't need this value
      setApiKeys(await db.apiKey.toArray());
      setIsLoading(false);
      hideLoader();
    }
    fetchData();
  }, []);

  const handleSwitchChange = async (record, isChecked) => {
    record.active = isChecked;
    await db.discoveryPlugin.put(record);
  };

  const getRecord = (rowData) => {
    let record = {};
    for (let idx = 0; idx < columns.length; idx++) {
      record[columns[idx].name] = rowData[idx];
    }
    return record;
  };

  const columns = [
    {
      name: UUID,
      label: 'Uuid',
      options: {
        display: false,
        filter: false,
        sort: false,
      },
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
          const record = getRecord(tableMeta.rowData);
          return (
            <FormControlLabel
              control={
                <Switch color="primary" color="primary" checked={value} />
              }
              label={
                <div>
                  <IconButton>
                    <HelperPopover message={record.description} />
                  </IconButton>
                </div>
              }
              onChange={(event) => {
                updateValue(event.target.checked);
                handleSwitchChange(record, event.target.checked);
              }}
            />
          );
        },
      },
    },
    { label: 'Label', name: 'label' },
    {
      name: 'url',
      label: 'Url ',
      options: {
        display: false,
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta, updateValue) => {
          if (value === undefined) {
            return <div></div>;
          }

          let text = value;
          if (value.length > 32) {
            text = value.substring(0, 32) + '...';
          }

          return (
            <Tooltip title={value}>
              <span>{text}</span>
            </Tooltip>
          );
        },
      },
    },
    {
      name: 'groupName',
      label: 'Group Name',
      options: {
        display: false,
        filter: true,
        sort: false,
      },
    },
    {
      name: 'action',
      label: 'Action',
      options: {
        display: true,
        filter: true,
        sort: false,
      },
    },
    {
      name: 'method',
      label: 'Http Method',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    {
      name: 'contentTypeHeader',
      label: 'Content Type Header',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    {
      name: 'fieldMapping',
      label: 'Field Mappings',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    {
      name: 'headers',
      label: 'Headers',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    {
      name: 'pluginType',
      label: 'Plugin Type',
      options: {
        display: true,
        filter: true,
        sort: false,
      },
    },
    {
      name: 'authorizationBearerToken',
      label: 'AUTH BEARER TOKEN',
      options: {
        display: 'excluded',
        filter: true,
        sort: false,
      },
    },
    {
      name: 'authorizationUserName',
      label: 'AUTH USER NAME',
      options: {
        display: 'excluded',
        filter: true,
        sort: false,
      },
    },
    {
      name: 'authorizationPassword',
      label: 'AUTH PW',
      options: {
        display: 'excluded',
        filter: true,
        sort: false,
      },
    },
    {
      name: 'regex',
      label: 'Regex',
      options: {
        display: 'excluded',
        filter: false,
        sort: false,
      },
    },
    {
      name: 'country',
      label: 'Country',
      options: {
        display: false,
        filter: true,
        sort: false,
      },
    },
    {
      name: 'description',
      label: 'Description',
      options: {
        display: false,
        filter: false,
        sort: false,
      },
    },
    {
      name: 'homePage',
      label: 'Home Page',
      options: {
        display: false,
        filter: false,
        sort: false,
      },
    },
    {
      name: 'version',
      label: 'Version',
      options: {
        display: true,
        filter: false,
        sort: false,
      },
    },
    {
      label: 'OPTIONS',
      name: 'Options',
      options: {
        display: true,
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta, updateValue) => {
          const record = getRecord(tableMeta.rowData);
          return (
            <Fragment>
              <DiscoveryPluginFormDialog
                record={record}
                mode={'Edit'}
                rows={rows}
                setRows={setRows}
                apiKeys={apiKeys}
                pluginTypes={pluginTypes}
                setPluginTypes={setPluginTypes}
              />
              <Fragment>
                <Tooltip title={'Clone the discovery plugin so you can try different settings without wrecking the original.'}>
                  <IconButton
                    aria-controls="download-menu"
                    aria-haspopup="true"
                    onClick={async() => {
                      showLoader();
                      let plugin = await db.discoveryPlugin.get(record.uuid);
                      plugin.uuid = crypto.randomUUID();
                      plugin.label = plugin.label + ' (clone) ' + plugin.uuid;
                      await db.discoveryPlugin.add(plugin);
                      setRows(await db.discoveryPlugin.toArray());
                      hideLoader();
                    }}
                    size="large"
                  >
                    <FileCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={'Download the discovery plugin to share..'}>
                  <IconButton
                    aria-controls="download-menu"
                    aria-haspopup="true"
                    onClick={() => {
                      downloadJsonData(record, `${record.label}.json`);
                    }}
                    size="large"
                  >
                    <CloudDownload />
                  </IconButton>
                </Tooltip>
              </Fragment>
            </Fragment>
          );
        },
      },
    },
  ];

  const options = {
    searchAlwaysOpen: true,
    onRowsDelete: async (records, data) => {
      setIsLoading(true);
      showLoader();
      const deleteRecords = [];
      for (const [idx, value] of Object.entries(records.lookup)) {
        deleteRecords.push(rows[idx].uuid);
      }
      await db.discoveryPlugin.bulkDelete(deleteRecords);
      setRows(await db.discoveryPlugin.toArray());
      setIsLoading(false);
      hideLoader();
    },
    customToolbar: () => {
      return (
        <Fragment>
          <DiscoveryPluginFormDialog
            record={{...new DiscoveryPlugin()}}
            mode={'Add'}
            rows={rows}
            setRows={setRows}
            apiKeys={apiKeys}
            pluginTypes={pluginTypes}
            setPluginTypes={setPluginTypes}
          />
          <UploadDataDialog isLoading={isLoading} setIsLoading={setIsLoading} dataType={'discoveryPlugin'} />
        </Fragment>
      );
    },

    rowsPerPage: 25,
    rowsPerPageOptions: [10, 25, 50, 100],
    setTableProps: () => {
      return {
        size: 'small',
      };
    },
    print: false,
    download: false,
  };

  if (isLoading) {
    return <div></div>;
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!isLoading && (
        <MUIDataTable
          title={'Discovery Plugin Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      )}
    </Box>
  );
}
