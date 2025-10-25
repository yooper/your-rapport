import React, {useEffect, useState, Fragment} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import {StyledTextField, StyledTextFieldNoWidth} from "../inputs/StyledTextField";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import AddBoxIcon from "@mui/icons-material/AddBox";
import FormGroup from "@mui/material/FormGroup";
import InputAdornment from "@mui/material/InputAdornment";
import {processNotification} from "../../utilities/loaders"
import { db } from '../../models/db/dexieDb';
import HelperPopover from '../HelperPopover';

export default function ApiKeyFormDialog(props) {

  const {mode, originalKey} = props
  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState(props.record)

  const handleChange = (event) => {
    const name = event.target.name
    setRecord({
      ...record,
      [name]: event.target.value,
    })
  }

  useEffect(() => {
    setRecord(props.record)
  }, [props.record])

  const handleClose = () => {
    setOpen(false);
  }

  const handleSave = async() => {
    if (mode === 'Edit') {
      if(originalKey !== record.key){
        db.apiKey.delete(originalKey)
      }
      await db.apiKey.put(record);
      processNotification({
        title:'Api Key Updated',
        message: 'An Api Key was updated.',
        type: 'success'
      })
    }
    else
    {
      await db.apiKey.put(record);
      processNotification({
        title:'Api Key Added',
        message: 'An Api Key was added.',
        type: 'success'
      })
    }
    setOpen(false)
    setRecord({})
    props.setRows(await db.apiKey.toArray());
  }

  return (
    <Fragment>
      <IconButton
        id={mode}
        aria-controls="applications-menu"
        aria-haspopup="true"
        onClick={() => setOpen(true)}
        size="large">
        { mode === 'Add' ? <AddBoxIcon/> : <EditIcon/> }
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={'lg'}
        fullWidth={true}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{mode} Api Key</DialogTitle>
        <DialogContent>
            <form noValidate>
              <FormGroup>
                <FormControl>
                  <StyledTextField
                    sx={{ m: 0.5 }}
                    required
                    name="key"
                    id="key"
                    label="API Key Name"
                    fullWidth={true}
                    defaultValue={record?.key ?? ''}
                    inputProps={{ 'aria-label': 'controlled' }}
                    onChange={handleChange}
                    InputProps={{ endAdornment: (<InputAdornment position={'end'} sx={{mr:1}}>
                        <HelperPopover message={'Name of the Api key. Example, our key name is "host", the key gets referenced as {{host}}, using using within Discovery Plugins or Analysis Tools.'}/>
                      </InputAdornment>)
                    }}
                  />
                </FormControl>
                <br/>
                <FormControl>
                  <StyledTextFieldNoWidth
                    sx={{ m: 0.5 }}
                    required
                    name="value"
                    id="value"
                    label="API Key Value"
                    style={{ width: 500 }}
                    fullWidth={true}
                    defaultValue={record?.value ?? ''}
                    inputProps={{ 'aria-label': 'controlled' }}
                    onChange={handleChange}
                    InputProps={{ endAdornment: (<InputAdornment position={'end'} sx={{mr:1}}>
                        <HelperPopover message={'The value that gets substituted in when the software sees the key name referenced.'}/>
                      </InputAdornment>)
                    }}
                  />
                </FormControl>
              </FormGroup>
            </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant={'contained'} color={'cancel'}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant={'contained'}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
