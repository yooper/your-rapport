import React, { useState, useEffect, Fragment } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import JsonView from 'react18-json-view';

// TODO: fix rendering bug with json data not being indented.
export default function JsonAttributeViewerDialog(props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  const handleClose = () => {
    setOpen(false);
    props.setIsOpen(false);
  };

  function pushKeyLast(obj, key) {
    const { [key]: picked, ...rest } = obj;
    return picked === undefined ? rest : { ...rest, [key]: picked };
  }

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
          <h3>The base 64 encoded screenshot is always the last attribute</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {JSON.stringify(pushKeyLast(props.record, 'screenshot'), null, 4)}
          </pre>
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
