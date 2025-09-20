import React, { useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FormGroup from '@mui/material/FormGroup';

import { Autocomplete } from '@mui/material';
import Chip from '@mui/material/Chip';
import { Tag } from '../../../models/schemas/Tag';
import { debug } from '../../../services/logger_services';
import { db } from '../../../models/db/dexieDb';
import { hideLoader, processNotification, showLoader } from '../../../utilities/loaders';
import { StyledTextField } from '../../inputs/StyledTextField';
import { updateRecord } from '../../../models/db/local';
import { RAPPORT, UUID } from '../../../services/constants';

export default function AddTagsFormDialog(props) {
  const {rows, setRows} = props;
  const [open, setOpen] = React.useState(false);
  const [tags, setTags] = useState([]);
  const [record, setRecord] = useState(props.record)


  useEffect(() => {
    async function fetchData(){
      setTags(await db.tag.toArray());
    }
    fetchData();
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
    props.setIsOpen(false);
  };

  const handleSave = async () => {
    try{
      showLoader();
      const updatedRows = [...rows]
      const found = updatedRows.find(r => r.uuid == record.uuid);
      found.tags = record.tags ?? []
      setRows(updatedRows)
      await db.tag.bulkPut(record.tags.map(t => new Tag(t)))
      await updateRecord(RAPPORT, UUID, record);
      processNotification({
        title: 'Tag(s) Added',
        message: `Tag(s) have been added.`,
        type: 'success',
      });
    }
    catch(e){
      debug(e.toString());
      processNotification({
        title: 'Tag(s) Add Error',
        message: e.toString(),
        type: 'danger',
      });
    }
    finally {
      setOpen(false);
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
                sx={{pt:1}}
                multiple
                id="tags"
                name="tags"
                options={tags?.map((tag) => tag.name)}
                defaultValue={record.tags?.map((tag) => tag)}
                freeSolo
                renderTags={(value, getTagProps) => {
                  return value.map((option, index) => (
                    <Chip
                      label={option} size="small" sx={{margin: '3px'}}
                    />
                  ));
                }}
                renderInput={(params) => (
                  <StyledTextField {...params} label="Assign Tags.." helperText={'Press Enter to add a tag. Multiple tags can set.'} />
                )}
                onChange={(event, newValue) => {
                    setRecord(prevState => ({...prevState, tags: newValue.map(tagName => tagName.toLowerCase())}))
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
