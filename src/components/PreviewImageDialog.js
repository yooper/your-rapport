import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {DialogContentText} from "@mui/material";
import {useEffect} from "react";
import {Fragment} from "@emotion/react/jsx-runtime";

/**
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export default function PreviewImageDialog(props) {
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    setOpen(props.isOpen)
  }, [props.isOpen]);


  const handleClose = () => {
    setOpen(false);
  };


  return (
    <Fragment>
      <Dialog
        color='grey'
        fullWidth={true}
        maxWidth={'xl'}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>{`Collected On: ${props.record.createdOnLocalTime} - ${props.record.url}` }</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <Box>
            <img src={props.record.screenshot} title={props.record.title} width={'100%'} height={'100%'}></img>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}