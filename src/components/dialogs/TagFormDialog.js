import React, { useState, Fragment } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { StyledTextField } from '../inputs/StyledTextField';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FormGroup from '@mui/material/FormGroup';
import InputAdornment from '@mui/material/InputAdornment';
import HelperPopover from '../HelperPopover';

import {
  hideLoader,
  processNotification,
  showLoader,
} from '../../utilities/loaders';
import { db } from '../../models/db/dexieDb';
import { Selector } from '../../models/schemas/Selector';
import { Tag } from '../../models/schemas/Tag';
import { debug } from '../../services/logger_services';

export default function TagFormDialog(props) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState({});

  const handleChange = (event) => {
    const name = event.target.name;
    setRecord({
      ...record,
      [name]: event.target.value,
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    props.setIsLoading(true);
    showLoader();
    record.active = true;
    try{
      db.tag.add(new Tag(record.name))
      processNotification({
        title: 'Tag Added',
        message: `Tag ${record.name} has been added.`,
        type: 'success',
      });
    }
    catch(e){
      debug(e.toString());
      processNotification({
        title: 'Tag Add Error',
        message: e.toString(),
        type: 'danger',
      });
    }
    finally {
      props.setRows(await db.tag.toArray());
      setOpen(false);
      props.setIsLoading(false);
      hideLoader();
    }
  };

  return (
    <Fragment>
      <IconButton
        color="white"
        id={'Add'}
        aria-controls="applications-menu"
        aria-haspopup="true"
        onClick={() => setOpen(true)}
        size="large"
      >
        <AddBoxIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Add Tag</DialogTitle>
        <DialogContent>
          <form noValidate>
            <FormGroup>
              <FormControl>
                <StyledTextField
                  sx={{ m: 0.5 }}
                  required
                  name="name"
                  id="name"
                  label="Tag Value"
                  defaultValue={record?.name ?? ''}
                  inputProps={{ 'aria-label': 'controlled' }}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position={'end'} sx={{ mr: 1 }}>
                        <HelperPopover
                          message={
                            'A unique name / value that will be used to annotate your data.'
                          }
                        />
                      </InputAdornment>
                    ),
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
