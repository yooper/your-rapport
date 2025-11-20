import React, { useState, Fragment, useEffect } from 'react';
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
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import HelperPopover from '../HelperPopover';

import {
  getSelectorTypeMap,
  hideLoader,
  processNotification,
  showLoader,
} from '../../utilities/loaders';
import { db } from '../../models/db/dexieDb';
import { Selector } from '../../models/schemas/Selector';
import { debug } from '../../services/logger_services';
import * as SelectorSchema from 'zod';
import { SelectorInfer } from '../../models/validators/Selector.validator';

export default function SelectorFormDialogV2(props) {
  const [record, setRecord] = useState({});
  const { open, setOpen, refreshRows} = props

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  const handleChange = (event) => {
    const name = event.target.name;
    setRecord({
      ...record,
      [name]: event.target.value,
    });
  };

  const handleClose = () => {
    setOpen(false);
    props.setOpen(false);
  };

  const handleSave = async () => {
    showLoader();
    props.setIsLoading(true);
    record.active = true;
    try {
      const result = Selector.validate(record);
      if(!result.ok){
        processNotification({title:'Invalid Selector Settings', message:result.errors, type:'danger'});
      }
      else{
        // takes awhile to run
        await Selector.add(new Selector(record.name, record.selectorTypeName));
        processNotification({
          title: 'Selector Added',
          message: `Selector ${record.name} has been added.`,
          type: 'success',
        });
      }
    } catch (e) {
      debug(e.toString());
      processNotification({
        title: 'Selector Add Error',
        message: e.toString(),
        type: 'danger',
      });
    } finally {
      setOpen(false);
      props.setIsLoading(false);
      refreshRows()
      hideLoader();
    }
  };

  return (
    <Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Add Selector</DialogTitle>
        <DialogContent>
          <form noValidate>
            <FormGroup>
              <FormControl>
                <StyledTextField
                  sx={{ m: 0.5 }}
                  required
                  name="name"
                  id="name"
                  label="Selector Value"
                  defaultValue={record?.name ?? ''}
                  inputProps={{ 'aria-label': 'controlled' }}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position={'end'} sx={{ mr: 1 }}>
                        <HelperPopover
                          message={
                            'A unique name / value that will be used to search through your collected content.'
                          }
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
              <br />
              <FormControl>
                <StyledTextField
                  sx={{ m: 0.5 }}
                  required
                  name="selectorTypeName"
                  id="selectorTypeName"
                  label="Selector Type"
                  defaultValue={record?.selectorTypeName ?? 'keyword'}
                  inputProps={{ 'aria-label': 'controlled' }}
                  onChange={handleChange}
                  select
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position={'end'} sx={{ mr: 1 }}>
                        <HelperPopover
                          message={
                            'The selector type determines which Discovery Plugins will be available to the selector.'
                          }
                        />
                      </InputAdornment>
                    ),
                  }}
                >
                  {Object.entries(getSelectorTypeMap()).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </StyledTextField>
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
