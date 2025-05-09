import React, {useState, Fragment} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {StyledTextField} from "../inputs/StyledTextField";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import AddBoxIcon from "@mui/icons-material/AddBox";
import FormGroup from "@mui/material/FormGroup";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import HelperPopover from "../HelperPopover";
import {getSelectorTypeMap, hideLoader, processNotification, showLoader} from "../../utilities/loaders";
import {Selector} from "../../models/schemas/Selector";

export default function SelectorFormDialog(props) {

  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState({} )

  const handleChange = (event) => {
    const name = event.target.name
    setRecord({
      ...record,
      [name]: event.target.value,
    })
  }

  const handleClose = () => {
    setOpen(false);
  }

  const handleSave = async() => {
    props.setIsLoading(true);
    showLoader();
    await Selector.add(record);
    processNotification({title: 'Selector Added', message: `Selector ${record.key} has been added.`, type: 'success'});
    let selectors = props.rows;
    selectors.push(record);
    props.setRows(selectors);
    setOpen(false);
    props.setIsLoading(false);
    hideLoader();
  }

  return (
    <Fragment>
      <IconButton
        color="white"
        id={'Add'}
        aria-controls="applications-menu"
        aria-haspopup="true"
        onClick={() => setOpen(true)}
        size="large">
        <AddBoxIcon/>
      </IconButton>

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
                    name="key"
                    id="key"
                    label="Selector Value"
                    defaultValue={record?.key ?? ''}
                    inputProps={{ 'aria-label': 'controlled' }}
                    onChange={handleChange}
                    InputProps={{ endAdornment: (<InputAdornment position={'end'} sx={{mr:1}}>
                        <HelperPopover message={'A unique name / value that will be used to search through your collected content.'}/>
                      </InputAdornment>)
                    }}
                  />
                </FormControl>
                <br/>
                <FormControl>
                  <StyledTextField
                    sx={{ m: 0.5 }}
                    required
                    name="selectorTypeName"
                    id="selectorTypeName"
                    label="Selector Type"
                    defaultValue={record?.selectorTypeName ?? ''}
                    inputProps={{ 'aria-label': 'controlled' }}
                    onChange={handleChange}
                    select
                    InputProps={{ endAdornment: (<InputAdornment position={'end'} sx={{mr:1}}>
                        <HelperPopover message={'The selector type determines which Discovery Plugins will be available to the selector.'}/>
                      </InputAdornment>)
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
