import React, { useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  FormControlLabel,
  Switch,
  TextareaAutosize,
} from '@mui/material';
import { getLocalItem, setLocalItem } from '../../../models/db/local';
import { processNotification } from '../../../utilities/loaders';
import IconButton from '@mui/material/IconButton';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import FormGroup from '@mui/material/FormGroup';
import HelperPopover from '../../HelperPopover';
import Grid from '@mui/material/Unstable_Grid2';
import BulkdAutomationUrl from '../../../models/schemas/BulkAutomationUrl';
import { Configuration } from '../../../models/schemas/Configuration';
import { BULK_AUTOMATION } from '../../../services/constants';

export default function BulkAutomationAddDialog(props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [unit, setUnit] = useState('count');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setOpen(props.open);
      setIsLoading(false);
    }
    fetchData();
  }, [props.open]);

  const handleClose = () => {
    setOpen(false);
  };

  /**
   * Helps with filter bad urls
   * @param string
   * @returns {boolean}
   * @private
   */
  function _isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  const handleSave = async () => {
    if (text.length > 0 && text.trim().length > 0) {
      const urls = text.split('\n').filter((t) => t && _isValidUrl(t));
      const existingUrls = (await getLocalItem(BULK_AUTOMATION)) ?? [];
      const unitDefault = await Configuration.getConfigurationValue(
        'automationUnitDefault',
        'count'
      );
      const valueDefault = await Configuration.getConfigurationValue(
        'automationValueDefault',
        100
      );
      let automateUrls = urls.map((url) => {
        return BulkdAutomationUrl.createBulkAutomationJob(url);
      });

      const rows = existingUrls.concat(automateUrls);
      props.setRows(rows);
      await setLocalItem(BULK_AUTOMATION, rows);
      processNotification({
        title: 'Bulk Automation',
        message: `${urls.length} sites have been added to the bulk automation queue.`,
        type: 'success',
      });
    }
    setOpen(false);
  };

  if (isLoading) {
    return <div></div>;
  }

  return (
    <Fragment>
      <IconButton>
        <LibraryAddIcon onClick={() => setOpen(true)} />
      </IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth={true}
        maxWidth={'lg'}
      >
        <DialogTitle>Bulk Collect Urls</DialogTitle>
        <DialogContent>
          <FormGroup>
            <Grid container spacing>
              <Grid item xs={1}>
                <HelperPopover
                  message={
                    'The default is to collect by the number of screenshots, when disabled it collects based on time spent collecting.'
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      disabled={true}
                      checked={true}
                      onChange={(event) => {
                        setUnit(event.target.checked ? 'count' : 'time');
                      }}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                  }
                  label="Collection Methodology"
                />
              </Grid>
            </Grid>
          </FormGroup>
          <FormGroup>
            <TextareaAutosize
              style={{ width: '90%' }}
              minRows={25}
              maxRows={100}
              placeholder="Enter your urls to bulk scan, one url per line..."
              name="urls"
              id="urls"
              defaultValue={text}
              onChange={(e) => setText(e.target.value)}
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="cancel" variant={'contained'}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="secondary" variant={'contained'}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
