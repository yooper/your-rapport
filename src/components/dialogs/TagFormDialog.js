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

import {
  hideLoader,
  processNotification,
  showLoader,
} from '../../utilities/loaders';
import { db } from '../../models/db/dexieDb';
import { Tag } from '../../models/schemas/Tag';
import { debug } from '../../services/logger_services';
import { Autocomplete } from '@mui/material';
import Chip from '@mui/material/Chip';

export default function TagFormDialog(props) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState({});
  const [tags, setTags] = useState([]);
  const [userAddedTags, setUserAddedTags] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setTags(await db.tag.toArray());
    }
    fetchData();
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    props.setIsLoading(true);
    showLoader();
    const allTagNames = [...tags?.map((tag) => tag.name), ...userAddedTags];
    const allTags = [...new Set(allTagNames)].map((t) => new Tag(t));

    try {
      await db.tag.bulkPut(allTags);
      props.setRows(allTags);
      processNotification({
        title: 'Tag Added',
        message: `Tag ${userAddedTags.join()} has been added.`,
        type: 'success',
      });
    } catch (e) {
      debug(e.toString());
      processNotification({
        title: 'Tag Add Error',
        message: e.toString(),
        type: 'danger',
      });
    } finally {
      setOpen(false);
      props.setIsLoading(false);
      hideLoader();
    }
  };

  return (
    <Fragment>
      <IconButton
        color="primary"
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
                <Autocomplete
                  sx={{ pt: 1 }}
                  multiple
                  id="tags"
                  name="tags"
                  options={tags?.map((tag) => tag.name.toLowerCase())}
                  defaultValue={[]}
                  freeSolo
                  renderTags={(value, getTagProps) => {
                    return value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        sx={{ margin: '3px' }}
                        key={`${option}_${index}`}
                      />
                    ));
                  }}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      label="Add Tags.."
                      helperText={
                        'PRESS ENTER after each tag phrase to add a tag. Multiple tags can be set before saving.'
                      }
                    />
                  )}
                  onChange={(event, newValue) => {
                    setUserAddedTags(newValue);
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
