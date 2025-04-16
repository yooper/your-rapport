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
import {createTab} from "../../utilities/loaders";

export default function UploadDataDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
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
        // copy and pasted from browser_capture.js
        // TODO: refactor adding and removing screenshots.
        let configurationRegistry = await getLocalItem('configuration') ?? { authToken: false, productVersion: 'trial'};
        const isAuthenticated = configurationRegistry.authToken ?? false;
        const isProVersion = configurationRegistry.productVersion === 'pro';
        // get/set the record count
        configurationRegistry.recordCount = configurationRegistry?.recordCount ?? 0
        // You must be authenticated to use the capture feature for over a 100 captures.

        const newRecords = JSON.parse(e.target.result);
        // TODO: fix issue with add duplicates
        let screenshotRegistry = await getLocalItem('screenshots');
        let records = screenshotRegistry?.records ?? [];
        screenshotRegistry.records = records.concat(newRecords);
        configurationRegistry.recordCount = screenshotRegistry.records.length;

        if(!isAuthenticated && configurationRegistry.recordCount >= 100){
            await createTab('https://osintliar.com/your-rapport-authentication-error/', true);
            throw new Error("You MUST register if you want to collect more than 100 captures.");
        }
        if(isAuthenticated && configurationRegistry.recordCount >= 200 && !isProVersion){
            await createTab('https://osintliar.com/your-rapport-authentication-error/', true);
            throw new Error("You MUST register and have the PRO paid version if you want to collect more than 200 captures.");
        }
        await setLocalItem('screenshots', screenshotRegistry);
        // update the configuration last
        configurationRegistry.lastSavedOn = Date.now().toString();
        await setLocalItem('configuration', configurationRegistry);
        setOpen(false);

      } catch (err) {
        setError('Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Fragment>
        <IconButton
        key={'select-import-type-menu'}
        aria-controls={`menu`}
        aria-haspopup="true"
        onClick={() => setOpen(true) }
        size="large">
            <CloudUpload style={{zIndex:1000}} variant="outlined"/>
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
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
