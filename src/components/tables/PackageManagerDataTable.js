import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable from 'mui-datatables';
import Chip from '@mui/material/Chip';
import {
  hideLoader,
  installPackage, processNotification,
  showLoader,
} from '../../utilities/loaders';
import { convertKeysToCamelCase } from '../../utilities/transformers';
import IconButton from '@mui/material/IconButton';
import HelperPopover from '../HelperPopover';
import { DISCOVERY_PLUGIN, UUID } from '../../services/constants';
import { db } from '../../models/db/dexieDb';

// TODO add bulk install packages
export default function PackageManagerDataTable(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    showLoader();
    setIsLoading(true);
    // remote packages
    // TODO: cache this call
    const response = await fetch(
      'https://raw.githubusercontent.com/osint-liar/public-packages/develop/index.json'
    );
    const data = await response.json();
    // convert the data to camelCase
    const externalPackages = convertKeysToCamelCase(data).filter(
      (r) => r.action !== 'Middleware'
    );

    const localPackages = await db.discoveryPlugin.toArray();
    externalPackages.forEach((ep) => (ep.action = 'install'));

    // Iterate through the first list
    externalPackages.forEach((remoteRecord) => {
      // Check for a match in the second list
      const found = localPackages.find(
        (localRecord) => localRecord.uuid === remoteRecord.uuid
      );
      if (found) {
        if (found.version !== remoteRecord.version) {
          remoteRecord.action = 'updatable';
        } else if (!found.active) {
          remoteRecord.action = 'deactivated';
        } else {
          remoteRecord.action = 'installed';
        }
      }
    });

    setRows(externalPackages);
    // merge discovery plugin or view
    setIsLoading(false);
    hideLoader();
  }

  const getRecord = (rowData) => {
    let record = {};
    const columns = getColumns();
    for (let idx = 0; idx < columns.length; idx++) {
      record[columns[idx].name] = rowData[idx];
    }
    return record;
  };

  const getColor = (value) => {
    switch (value) {
      case 'install':
        return 'secondary';
      case 'update':
        return 'primary';
      default:
        return 'default';
    }
  };

  /**
   * Install the package
   * @param record
   * */
  const upsert = async (record) => {
    setIsLoading(true);
    showLoader();
    await installPackage(record);
    processNotification({title: `Discovery Plugin Installed`, message: `The discovery plugin ${record.label}`, type: 'success'});
    // TODO: refresh the package table without re-pulling the data
    await fetchData();
    hideLoader();
    setIsLoading(false);
  };

  const getColumns = () => {
    let columns = [
      {
        label: ' ',
        name: 'description',
        options: {
          display: true,
          filter: true,
          sort: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const record = getRecord(tableMeta.rowData);
            return (
              <div>
                <IconButton>
                  <HelperPopover message={record.description} />
                </IconButton>
              </div>
            );
          },
        },
      },
      { label: 'Label', name: 'label' },
      { label: 'Version', name: 'version' },
      {
        name: 'action',
        label: 'Action',
        options: {
          display: true,
          filter: false,
          sort: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            const record = getRecord(tableMeta.rowData);
            if (value === undefined) {
              return <div></div>;
            } else {
              return (
                <div>
                  <Chip
                    label={value}
                    color={getColor(value)}
                    onClick={async () => {
                      await upsert(record);
                    }}
                  />
                </div>
              );
            }
          },
        },
      },
      {
        name: 'country',
        label: 'Country',
        options: {
          display: true,
          filter: true,
          sort: true,
          customBodyRender: (value, tableMeta, updateValue) => {
            if (value === undefined) {
              return <div></div>;
            } else {
              return (
                <div>
                  <Chip label={value} color={'primary'} />
                </div>
              );
            }
          },
        },
      },
      {
        name: 'updatedOn',
        label: 'Updated On',
        options: {
          display: true,
          filter: false,
          sort: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            if (value === undefined) {
              return <div>??</div>;
            } else if (!value) {
              return <div>{new Date().toLocaleString()}</div>;
            } else {
              return <div>{new Date(value).toLocaleString()}</div>;
            }
          },
        },
      },
    ];

    const notVisibleColumns = [UUID, 'url', 'type'];
    notVisibleColumns.forEach((fieldName) => {
      columns.push({
        name: fieldName,
        label: fieldName,
        options: {
          display: 'excluded',
          filter: false,
          sort: false,
        },
      });
    });
    return columns;
  };

  const options = {
    searchAlwaysOpen: true,
    setTableProps: () => {
      return {
        size: 'small',
      };
    },
    print: false,
    filter: true,
    download: false,
    onRowsDelete: async (records, data) => {
      setIsLoading(true);
      showLoader();
      for (const [idx, value] of Object.entries(records.lookup)) {
        await db.discoveryPlugin.delete(rows[idx].uuid);
      }
      await fetchData();
      setIsLoading(false);
      hideLoader();
    },
  };

  if (isLoading) {
    return <div></div>;
  }
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {!isLoading && (
        <MUIDataTable
          title={'Package Management'}
          data={rows}
          columns={getColumns()}
          options={options}
        />
      )}
    </Box>
  );
}
