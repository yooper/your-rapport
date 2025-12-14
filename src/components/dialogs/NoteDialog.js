import React, { useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import { FormControl, TextareaAutosize } from '@mui/material';
import { processNotification, showLoader } from '../../utilities/loaders';
import { RAPPORT, UUID } from '../../services/constants';
import { updateRecord } from '../../models/db/local';
import { getUtcNow } from '../../utilities/transformers';

export default function NotesDialog(props) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState(props.record);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setOpen(props.open);
      setIsLoading(false);
    }
    fetchData();
  }, [props.open]);

  const handleClose = () => {
    setOpen(false);
  };


  const handleSave = async() => {
    // only update if the values differ
    if (props.record.note !== record.note) {
      showLoader();
      await updateRecord(RAPPORT, UUID, record);
      props.refreshRows();
    }
    setOpen(false);
  };

  if (isLoading) {
    return <div></div>;
  }

  return (
    <Fragment>
      <EditIcon onClick={() => setOpen(true)} />
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth={true}
        maxWidth={'md'}
      >
        <DialogTitle>Notes</DialogTitle>
        <DialogContent>
          <TextareaAutosize
            style={{ width: '90%' }}
            minRows={10}
            maxRows={10}
            placeholder="Enter notes..."
            name="note"
            id="note"
            defaultValue={props.record.note ?? ''}
            onChange={(e) =>
              setRecord((prevState) => ({
                ...prevState,
                note: e.target.value,
                updatedOn: getUtcNow()
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="cancel" variant={'contained'}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="secondary" variant={'contained'}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
