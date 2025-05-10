import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Input
} from '@mui/material';
import {CloudUpload} from "@mui/icons-material";
import {Fragment} from "@emotion/react/jsx-runtime";
import IconButton from "@mui/material/IconButton";
import {getLocalItem, setLocalItem} from "../../models/db/local";
import { hideLoader, showLoader} from "../../utilities/loaders";

export default function UploadDataDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    showLoader();
    const file = event.target.files[0];
    setError('');
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Only JSON files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async(e) => {
      try {
        let configurationRegistry = await getLocalItem('configuration') ?? { authToken: false, productVersion: 'trial'};
        // get/set the record count
        configurationRegistry.recordCount = configurationRegistry?.recordCount ?? 0
        const newRecords = JSON.parse(e.target.result);
        // TODO: fix issue with adding duplicates, the uuid is the unique key
        let rapports = await getLocalItem('rapports') ?? [];
        // TODO: sort by dates.
        configurationRegistry.screenShotCount = rapports.length;
        await setLocalItem('rapports', rapports.concat(newRecords));
        // update the configuration last
        configurationRegistry.lastSavedOn = Date.now().toString();
        await setLocalItem('configuration', configurationRegistry);
        setOpen(false);
        hideLoader();

      } catch (err) {
        setError('Invalid JSON format.');
        hideLoader();
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
        onClick={() => setOpen(true) }
        size="large">
            <CloudUpload style={{zIndex:1000}} variant="outlined" />
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
          <Button variant={'contained'} color={'cancel'} onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
