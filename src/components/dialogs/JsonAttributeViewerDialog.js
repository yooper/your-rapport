import React, {useState, useEffect, Fragment} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import JsonView from "react18-json-view";

export default function JsonAttributeViewerDialog(props) {
  const [record, setRecord] = useState({})
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(props.isOpen)
  }, [props.isOpen]);

  const handleClose = () => {
    setOpen(false);
    props.setIsOpen(false);
  };

  return (
      <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth={true}
        maxWidth={'lg'}
      >
        <DialogTitle id="form-dialog-title">Debug Data Attributes</DialogTitle>
        <DialogContent>
            <JsonView src={record} theme="default" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="cancel" variant={'contained'}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </>
  );
}
