import React, { useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import AddBoxIcon from '@mui/icons-material/AddBox';
import IconButton from '@mui/material/IconButton';
import { sort_by_key } from '../../utilities/transformers';
import DiscoveryPluginLayout from '../layouts/DiscoveryPluginLayout';
import { processNotification } from '../../utilities/loaders';
import Box from '@mui/material/Box';
import { db } from '../../models/db/dexieDb';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';

type Mode = 'Add' | 'Edit';

export interface DiscoveryPluginRow {
  Uuid?: string;
  Label?: string;
  [key: string]: unknown; // allow extra backend fields
}

interface ApiSuccess<T> {
  Type?: 'success' | 'danger' | string;
  Record?: T;
  Records?: T[];
  Title?: string;
  Message?: string;
  [key: string]: unknown;
}

interface DiscoveryPluginFormDialogProps {
  mode: Mode;
  record: DiscoveryPluginRow;
  rows: DiscoveryPluginRow[];
  setRows: (rows: DiscoveryPluginRow[]) => void;

  // passed through to DiscoveryPluginLayout
  apiKeys?: unknown;
  pluginTypes: string[];
  setPluginTypes: (types: string[]) => void;
}

const DiscoveryPluginFormDialog: React.FC<DiscoveryPluginFormDialogProps> = (
  props
) => {
  const { mode } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [record, setRecord] = useState<DiscoveryPluginRow>(props.record);

  useEffect(() => {
    setRecord(props.record);
  }, [props.record]);

  const handleClose = () => {
    setOpen(false);
  };

  // TODO: save to local db
  const handleSave = async () => {
    if (mode === 'Add') {
      const newRecord: Partial<DiscoveryPlugin> = {...record , ...{ uuid: crypto.randomUUID() }}
      const result = DiscoveryPlugin.validate(newRecord)
      // invalid discovery plugin
      if(!result.ok){
        processNotification({title:'Invalid Discovery Plugin', message:result.errors, type:'danger'})
      }
      else
      {
        await db.discoveryPlugin.add(newRecord);
        processNotification({title:'Discovery Plugin Added', message:'A new discovery plugin was added.', type:'success'})

      }
    } else if (mode === 'Edit') {
      await db.discoveryPlugin.put(record);
    }

    const newRows = await db.discoveryPlugin.toArray();
    sort_by_key(newRows, 'label');
    props.setRows(newRows);
    setOpen(false);
  };

  return (
    <Fragment>
      <IconButton onClick={() => setOpen(true)}>
        {mode === 'Add' ? <AddBoxIcon /> : <EditIcon />}
      </IconButton>
      <Dialog
        fullWidth={true}
        maxWidth={false}
        open={open}
        onClose={handleClose}
        sx={{ height: '90%' }}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle>{mode} Discovery Plugin</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <form noValidate>
            <DiscoveryPluginLayout
              record={record}
              setRecord={setRecord}
              apiKeys={props.apiKeys as any}
              pluginTypes={props.pluginTypes}
              setPluginTypes={props.setPluginTypes}
            />
          </form>
        </DialogContent>
        <DialogActions>
          {/* MUI's Button color prop doesn't include 'cancel' by default; cast to avoid TS error */}
          <Button
            onClick={handleClose}
            variant="contained"
            color={'cancel' as any}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

export default DiscoveryPluginFormDialog;
