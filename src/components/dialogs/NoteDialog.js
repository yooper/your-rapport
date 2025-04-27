import React, {useState, Fragment, useEffect} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import {FormControl, TextareaAutosize} from "@mui/material";
import {processNotification} from "../../utilities/loaders";



export default function NotesDialog(props) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState(props.record);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() =>
  {
      async function fetchData() {
          setIsLoading(true)
          setOpen(props.open)
          setIsLoading(false)
      }
      fetchData();
  }, [props.open]);

  const handleClose = () => {
    setOpen(false)
  };

  const updateRecord = (uuid, newData) => {
    props.setRows(props.rows.map(item =>
      item.uuid === uuid ? { ...item, ...newData } : item
    ));
    //

  };

  const handleSave = () => {
    // only update if the values differ
    if(props.record.note !== record.note){
        updateRecord(props.record.uuid, record);
        chrome.runtime.sendMessage({
            cmd: "updateScreenShotRecord",
            record: record
        }).then((response) => {
            processNotification({title: 'Update Completed', message: `Record ${record.uuid} has been updated.`, type: 'success'});
        });
    }
    setOpen(false)
  };

  if(isLoading){
      return <div>
      </div>
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
                style={{ width: "90%" }}
                minRows={10}
                maxRows={10}
                placeholder="Enter notes..."
                name="note"
                id="note"
                defaultValue={props.record.note ?? ''}
                onChange={(e) => setRecord(prevState => ({...prevState, note: e.target.value, updatedOn: Date.now() }))}
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
