import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Input,
  type InputProps,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { CloudUpload } from '@mui/icons-material';
import { Fragment } from '@emotion/react/jsx-runtime';

import { hideLoader, processNotification, showLoader } from '../../utilities/loaders';
import { Configuration } from '../../models/schemas/Configuration';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';
import { db } from '../../models/db/dexieDb';
import { getUtcNow } from '../../utilities/transformers';
import { Rapport } from '../../models/schemas/Rapport';
import { Artifact } from '../../models/schemas/Artifact';
import { Attachment } from '../../types';
import { debug } from '../../services/logger_services';

type UploadDataType = 'discoveryPlugin' | 'rapport' | string;

export interface UploadDataDialogProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  dataType: UploadDataType;
}

/**
 * TODO: Add support for extracting selectors from incoming records
 * TODO: Add audit log support for duplicate records
 */
export default function UploadDataDialog(props: UploadDataDialogProps): JSX.Element {
  const { setIsLoading, dataType } = props;

  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  type FileReaderOnLoadEvent = ProgressEvent<FileReader> & {
    target: FileReader & { result: string };
  };

  const handleDiscoveryPluginsUpload = async (e: FileReaderOnLoadEvent): Promise<void> => {
    const newRecords: unknown = JSON.parse(e.target.result);

    if (Array.isArray(newRecords)) {
      const validPlugins: any[] = [];

      for (const discoveryPlugin of newRecords) {
        const result = await DiscoveryPlugin.validate(discoveryPlugin as any);
        if (!result.ok) {
          processNotification({
            title: 'Invalid Discovery Plugin ' + (discoveryPlugin as any)?.label,
            message: result.errors?.join(', ') ?? `Invalid plugin ${discoveryPlugin?.label}`,
            type: 'danger',
          });
        } else {
          // the plugin by default must be off, if a background runner
          if ((discoveryPlugin as any).action === 'BackgroundRunner') {
            (discoveryPlugin as any).active = false;
          }
          validPlugins.push(discoveryPlugin);
        }
      }

      await db.discoveryPlugin.bulkPut(validPlugins);
      return;
    }

    // single object
    const discoveryPlugin = newRecords as any;
    const result = await DiscoveryPlugin.validate(discoveryPlugin);
    if (!result.ok) {
      processNotification(
        {
          title: 'Invalid Discovery Plugin ' + discoveryPlugin?.label,
          message: result.errors?.join(', ') ?? `Invalid plugin ${discoveryPlugin?.label}`,
          type: 'danger',
        },
        5000
      );
      return;
    }

    if (discoveryPlugin.action === 'BackgroundRunner') {
      discoveryPlugin.active = false;
    }
    await db.discoveryPlugin.put(discoveryPlugin);
  };

  const handleFileChange: InputProps['onChange'] = (event) => {
    showLoader();
    setIsLoading(true);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    setError('');
    if (!file) {
      setIsLoading(false);
      hideLoader();
      return;
    }

    if (file.type !== 'application/json') {
      setError('Only JSON files are allowed.');
      setIsLoading(false);
      hideLoader();
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt: ProgressEvent<FileReader>) => {
      showLoader();
      setIsLoading(true);

      try {
        const fe = evt as FileReaderOnLoadEvent;

        if (dataType === 'discoveryPlugin') {
          await handleDiscoveryPluginsUpload(fe);
        } else {
          // TODO: Add rapport record validation
          const configuration = await Configuration.getConfiguration();

          // TODO: validate the rapports being imported
          const newRapports: Rapport[] =
            Array.isArray(JSON.parse(fe.target.result)) ? JSON.parse(fe.target.result) : [JSON.parse(fe.target.result)];
          await debug(`${newRapports.length} rapports are ready to be processed`);
          // TODO: use a background job to rebuild the selectors.
          // TODO: fix issue with adding duplicates, the uuid is the unique key

          const count = await db.rapport.count();
          configuration.screenShotCount = count + newRapports.length;

          for(const rapport of newRapports){
            await debug(`Processing rapport ${rapport.uuid}`);
            let artifacts: Artifact[] = []
            let attachments: Attachment[] = []
            for(const tmpArtifact of rapport?.artifacts ?? []){
              try{
                const artifact: Artifact = await Artifact.deserialize(tmpArtifact)
                artifacts.push(artifact);
                attachments.push(Artifact.getAttachment(artifact))
              }
              catch(e){
                await debug('Artifact error while importing '+String(e), tmpArtifact);
              }
            }
            await debug(`Rapport ${rapport.uuid} artifacts processed.`);
            await db.artifact.bulkPut(artifacts);
            rapport.artifacts = attachments;
          }

          db.rapport.bulkPut(newRapports);
          // update the configuration last
          configuration.updatedOn = getUtcNow();
          await Configuration.setConfiguration(configuration);
        }
      } catch (err) {
        setError('Invalid JSON format.');
      } finally {
        setIsLoading(false);
        hideLoader();
        setOpen(false);

        // reset input so selecting the same file again triggers onChange
        input.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <Fragment>
      <IconButton
        key="import-data"
        aria-controls="menu"
        aria-haspopup="true"
        onClick={() => setOpen(true)}
        size="large"
      >
        <CloudUpload style={{ zIndex: 1000 }} />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upload Dataset</DialogTitle>

        <DialogContent>
          <Input type="file" inputProps={{ accept: '.json' }} onChange={handleFileChange} />

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="cancel" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
