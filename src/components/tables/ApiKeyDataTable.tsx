import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import ConfigurationOptionRepo from '../../models/repository/ConfigurationOptionRepo';
import MUIDataTable, {
  MUIDataTableColumn,
  MUIDataTableOptions,
  MUIDataTableIsRowCheck,
} from 'mui-datatables';
import ApiKeyFormDialog from '../dialogs/ApiKeyFormDialog';
import { processNotification } from '../../utilities/loaders';

// ⬇️ Import your Dexie instance
// Adjust this path to wherever you initialize Dexie and export `db`
import { db } from '../../models/db/dexieDb';
import { ApiKey } from '../../types';

const ApiKeyDataTable: React.FC = () => {
  const [rows, setRows] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setConfig(await ConfigurationOptionRepo.getConfigObject());
      setRows(await db.apiKey.toArray());
      setIsLoading(false);
    })();
  }, []);

  const columns: MUIDataTableColumn[] = [
    { label: 'key', name: 'Api Key Name' },
    {
      label: 'Copy Api Key',
      name: 'CopyToClipboard',
      options: {
        filter: false,
        sort: false,
        customBodyRenderLite: (dataIndex: number) => (
          <CopyToClipboardIcon
            record={rows[dataIndex]}
            copyFieldName={'value'}
            message={'The Api Key Value was copied to your clipboard.'}
          />
        ),
      },
    },
    {
      name: 'Edit',
      label: 'Edit Api Key',
      options: {
        filter: false,
        sort: false,
        customBodyRenderLite: (dataIndex: number) => {
          const row = rows[dataIndex];
          return (
            <ApiKeyFormDialog
              record={row}
              mode={'Edit'}
              originalKey={row?.key ?? undefined}
              setRows={setRowsFromDb}
            />
          );
        },
      },
    },
  ];

  // Helper that refreshes rows from Dexie and updates table
  const setRowsFromDb = async () => {
    const all = await db.apiKey.toArray();
    setRows(all);
  };

  const options: MUIDataTableOptions = {
    searchAlwaysOpen: true,
    onRowsDelete: async (rowsDeleted: {
      data: MUIDataTableIsRowCheck[];
      lookup: Record<number, boolean>;
    }) => {
      // Collect selected primary keys
      const keysToDelete = Object.keys(rowsDeleted.lookup)
        .map((idxStr) => rows[Number(idxStr)]?.Key)
        .filter((k): k is string => typeof k === 'string' && k.length > 0);

      let hadError = false;
      try {
        // bulkDelete expects an array of primary keys
        await db.apiKey.bulkDelete(keysToDelete);
      } catch (e) {
        hadError = true;
        processNotification({
          Title: 'Delete Failed',
          Message: 'One or more API keys could not be deleted.',
          Type: 'danger',
        });
      }

      await setRowsFromDb();

      if (!hadError) {
        processNotification({
          Title: 'Api Key(s) Deleted',
          Message: 'Api Key(s) were deleted',
          Type: 'success',
        });
      }
    },
    customToolbar: () => (
      <ApiKeyFormDialog
        record={{ key: null, value: null }}
        mode={'Add'}
        originalKey={''}
        setRows={setRowsFromDb}
      />
    ),
    setTableProps: () => {
      return {
        size: 'small',
      } as React.TableHTMLAttributes<HTMLTableElement>;
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
          title={'API Key Management'}
          data={rows}
          columns={columns}
          options={options}
        />
      )}
    </Box>
  );
};

export default ApiKeyDataTable;
