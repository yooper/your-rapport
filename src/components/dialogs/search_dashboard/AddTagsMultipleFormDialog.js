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
import { Configuration } from '../../../models/schemas/Configuration';
import { getUtcNow } from '../../../utilities/transformers';
import { Rapport } from '../../../models/schemas/Rapport';


export default function AddTagsMultiplFormDialog(props) {
  const { refreshRows, rapports } = props;
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
      const userTags = [...new Set(userAddedTags)].map((t) => new Tag(t));
      await db.tag.bulkPut(userTags);
      for(const rapport of rapports){
        const tagNames = rapport.tags.map(rt => rt.name).concat(userTags.map(ut => ut.name))
        rapport.tags = [...new Set(tagNames)].map((t) => new Tag(t));
        await Rapport.put(rapport);
      };

      const configuration = await Configuration.getConfiguration();
      configuration.updatedOn = getUtcNow();
      await Configuration.setConfiguration(configuration);
      refreshRows();
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
                defaultValue={[]}
                options={tags?.map((tag) => tag.name.toLowerCase())}
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
