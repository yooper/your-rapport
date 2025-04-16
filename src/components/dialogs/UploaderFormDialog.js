import React, { useCallback, useEffect, useRef, useState, Fragment } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton";
import {useDropzone} from "react-dropzone";
import {CloudUpload} from "@mui/icons-material";
import fetch_plus from "../../common/data_transfers";
import fetch_wrapper from "../../common/fetch_wrapper";
import {hideLoader, processNotification, showLoader} from "../../common/utilities";
import {reload} from "../../common/callbacks";

export default function UploaderFormDialog(props) {

  const [open, setOpen] = useState(false);

  const onDrop = useCallback(async(acceptedFiles) => {
    showLoader()
    for(let idx = 0; idx < acceptedFiles.length; idx++)
    {
      const file = acceptedFiles[idx]
      const fileName = file.name;
      const clone = new File([file], fileName, {type: file.type})
      let formData = new FormData();
      formData.append('ContentFile', clone)
      formData.append('ContentTitle', fileName)
      formData.append('ContentCaseManagementUuid', props.config['ActiveCase'])

      const data = await fetch_wrapper(props.url, {
          method: 'POST',
          body: formData
        })
      hideLoader()
      processNotification(data)
    }
    hideLoader()
    location.replace(props.reloadUrl)

  }, [])

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <Fragment>
      <IconButton
        aria-controls="upload-menu"
        aria-haspopup="true"
        onClick={() => setOpen(true)}
        size="large">
        <CloudUpload/>
      </IconButton>

    <Dialog
      onClose={() => { setOpen(false)}}
      aria-labelledby="simple-dialog-title"
      open={open}
      maxWidth={'sm'}
    >
      <DialogTitle id="simple-dialog-title">{props.title}</DialogTitle>
      <DialogContent>
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          {
            <p>{props.helperText}</p>
          }
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
    </Fragment>
  );
}
