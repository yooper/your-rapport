import React, { useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormGroup from '@mui/material/FormGroup';

import { Autocomplete } from '@mui/material';
import Chip from '@mui/material/Chip';
import { Tag } from '../../../models/schemas/Tag';
import { debug } from '../../../services/logger_services';
import { db } from '../../../models/db/dexieDb';
import {
  hideLoader,
  processNotification,
  showLoader,
} from '../../../utilities/loaders';
import { StyledTextField } from '../../inputs/StyledTextField';
import { updateRecord } from '../../../models/db/local';
import { RAPPORT, UUID } from '../../../services/constants';

export default function AddTagsFormDialog(props) {
  const { rows, setRows, record } = props;
  const [open, setOpen] = React.useState(false);

  const [tags, setTags] = useState([]);
  const [userAddedTags, setUserAddedTags] = useState([]);

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  const handleClose = () => {
    setOpen(false);
    props.setIsOpen(false);
  };

  useEffect(() => {
    async function fetchData() {
      setTags(await db.tag.toArray());
    }
    fetchData();
    setOpen(props.isOpen);
  }, [props.isOpen]);

  const handleSave = async () => {
    try {
      showLoader();
      const updatedRows = [...rows];
      const found = updatedRows.find((r) => r.uuid == record.uuid);
      const userTags = [...new Set(userAddedTags)].map((t) => new Tag(t));
      found.tags = userTags;
      setRows(updatedRows);
      await db.tag.bulkPut(userTags);
      await updateRecord(RAPPORT, UUID, found);
      props.setRows(updatedRows);
      processNotification({
        title: 'Tag(s) Added',
        message: `Tag(s) have been added.`,
        type: 'success',
      });
    } catch (e) {
      debug(e.toString());
      processNotification({
        title: 'Tag(s) Add Error',
        message: e.toString(),
        type: 'danger',
      });
    } finally {
      setOpen(false);
      props.setIsOpen(false);
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
        <DialogTitle id="form-dialog-title">Add Tag(s)</DialogTitle>
        <DialogContent>
          <form noValidate>
            <FormGroup>
              <Autocomplete
                sx={{ pt: 1 }}
                multiple
                id="tags"
                name="tags"
                options={tags?.map((tag) => tag.name.toLowerCase())}
                defaultValue={record.tags?.map((tag) => tag.name)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        key={key}
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <StyledTextField
                    {...params}
                    label="Assign Tags.."
                    helperText={
                      'PRESS ENTER to add a tag. Multiple tags can set.'
                    }
                  />
                )}
                onChange={(event, newValue) => {
                  setUserAddedTags(newValue);
                }}
              />
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
