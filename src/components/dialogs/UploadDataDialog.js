import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Input,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { Fragment } from '@emotion/react/jsx-runtime';
import IconButton from '@mui/material/IconButton';
import { getLocalItem, setLocalItem } from '../../models/db/local';
import { hideLoader, showLoader } from '../../utilities/loaders';
import { Configuration } from '../../models/schemas/Configuration';
import { RAPPORT, UPDATED_ON } from '../../services/constants';

/**
 * TODO: Add support for extracting selectors from incoming records
 * TODO: Add audit log support for duplicate records
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export default function UploadDataDialog(props) {
  const { isLoading, setIsLoading } = props;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    showLoader();
    setIsLoading(true);
    const file = event.target.files[0];
    setError('');
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Only JSON files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let configuration = await Configuration.getConfiguration();
        // get/set the record count
        configuration.recordCount = configuration?.recordCount ?? 0;
        const newRecords = JSON.parse(e.target.result);
        // TODO: fix issue with adding duplicates, the uuid is the unique key
        let rapports = (await getLocalItem(RAPPORT)) ?? [];
        // TODO: sort by dates.
        configuration.screenShotCount = rapports.length;
        await setLocalItem(RAPPORT, rapports.concat(newRecords));
        // update the configuration last
        configuration[UPDATED_ON] = Date.now();
        await Configuration.setConfiguration(configuration);
      } catch (err) {
        setError('Invalid JSON format.');
        hideLoader();
      } finally {
        setIsLoading(false);
        hideLoader();
        setOpen(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Fragment>
      <IconButton
        key={'import-data'}
        aria-controls={`menu`}
        aria-haspopup="true"
        onClick={() => setOpen(true)}
        size="large"
      >
        <CloudUpload style={{ zIndex: 1000 }} variant="outlined" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upload a Your Rapport Dataset</DialogTitle>
        <DialogContent>
          <Input
            type="file"
            inputProps={{ accept: '.json' }}
            onChange={handleFileChange}
          />
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant={'contained'}
            color={'cancel'}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
