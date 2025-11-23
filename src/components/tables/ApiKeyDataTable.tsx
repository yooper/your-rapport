import * as React from 'react';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import MUIDataTable, {
  MUIDataTableColumn,
  MUIDataTableOptions,
  MUIDataTableIsRowCheck,
} from 'mui-datatables';
import ApiKeyFormDialog from '../dialogs/ApiKeyFormDialog'
import { processNotification } from '../../utilities/loaders';
import CopyToClipboardIcon from '../CopyToClipboardIcon';


// ⬇️ Import your Dexie instance
// Adjust this path to wherever you initialize Dexie and export `db`
import { db } from '../../models/db/dexieDb';
import { ApiKey } from '../../types';
import { Tooltip } from '@mui/material';

const ApiKeyDataTable: React.FC = () => {
  const [rows, setRows] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setRows(await db.apiKey.toArray());
      setIsLoading(false);
    })();
  }, []);

  const columns: MUIDataTableColumn[] = [
    { label: 'Api Key Name', name: 'key' },
    {
      label: 'Copy Api Key Value',
      name: 'CopyToClipboard',
      options: {
        filter: false,
        sort: false,
        customBodyRenderLite: (dataIndex: number) => (
          <Tooltip title={"Copy the Api key's value into your clipboard"}>
            <CopyToClipboardIcon
              record={rows[dataIndex]}
              copyFieldName={'value'}
              message={'The Api Key Value was copied to your clipboard.'}
            />
          </Tooltip>
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
              setRows={setRows}
            />
          );
        },
      },
    },
  ];

  const options: MUIDataTableOptions = {
    searchAlwaysOpen: true,
    onRowsDelete: async (rowsDeleted: {
      data: MUIDataTableIsRowCheck[];
      lookup: Record<number, boolean>;
    }) => {
      // Collect selected primary keys
      const keysToDelete = Object.keys(rowsDeleted.lookup)
        .map((idxStr) => rows[Number(idxStr)]?.key)
        .filter((k): k is string => typeof k === 'string' && k.length > 0);

      let hadError = false;
      try {
        // bulkDelete expects an array of primary keys
        await db.apiKey.bulkDelete(keysToDelete);
      } catch (e) {
        hadError = true;
        processNotification({
          title: 'Delete Failed',
          message: 'One or more API keys could not be deleted.',
          type: 'danger',
        });
      }

      if (!hadError) {
        processNotification({
          title: 'Api Key(s) Deleted',
          message: 'Api Key(s) were deleted.',
          type: 'success',
        });
      }
    },
    customToolbar: () => (
      <ApiKeyFormDialog
        record={{ key: null, value: null }}
        mode={'Add'}
        originalKey={''}
        setRows={setRows}
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
