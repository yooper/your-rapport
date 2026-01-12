import React, { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Input,
  type InputProps,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { CloudUpload } from "@mui/icons-material";

import { hideLoader, processNotification, showLoader } from "../../utilities/loaders";
import { Configuration } from "../../models/schemas/Configuration";
import { DiscoveryPlugin } from "../../models/schemas/DiscoveryPlugin";
import { db } from "../../models/db/dexieDb";
import { getUtcNow } from "../../utilities/transformers";
import { Rapport } from "../../models/schemas/Rapport";
import { Artifact } from "../../models/schemas/Artifact";
import { Attachment } from "../../types";
import { debug } from "../../services/logger_services";
import { getUser } from "../../models/schemas/User";

type UploadDataType = "discoveryPlugin" | "rapport" | string;

export interface UploadDataDialogProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  dataType: UploadDataType;
}

export default function UploadDataDialog(props: UploadDataDialogProps): JSX.Element {
  const { setIsLoading, dataType } = props;

  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // If getUser() returns null => single file only
  // If getUser() returns NOT null => multiple files allowed
  const [allowMultiple, setAllowMultiple] = useState<boolean>(false);

  const isJsonFile = (file: File): boolean => {
    const nameOk = file.name.toLowerCase().endsWith(".json");
    const typeOk = file.type === "application/json";
    return typeOk || nameOk;
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsText(file);
    });

  const normalizeToArray = <T,>(val: unknown): T[] =>
    Array.isArray(val) ? (val as T[]) : [val as T];

  const handleDiscoveryPluginsUploadFromText = async (jsonText: string): Promise<void> => {
    const parsed: unknown = JSON.parse(jsonText);

    if (Array.isArray(parsed)) {
      const validPlugins: any[] = [];

      for (const discoveryPlugin of parsed) {
        const result = await DiscoveryPlugin.validate(discoveryPlugin as any);
        if (!result.ok) {
          processNotification({
            title: "Invalid Discovery Plugin " + (discoveryPlugin as any)?.label,
            message:
              result.errors?.join(", ") ?? `Invalid plugin ${(discoveryPlugin as any)?.label}`,
            type: "danger",
          });
        } else {
          if ((discoveryPlugin as any).action === "BackgroundRunner") {
            (discoveryPlugin as any).active = false;
          }
          validPlugins.push(discoveryPlugin);
        }
      }

      await db.discoveryPlugin.bulkPut(validPlugins);
      return;
    }

    const discoveryPlugin = parsed as any;
    const result = await DiscoveryPlugin.validate(discoveryPlugin);
    if (!result.ok) {
      processNotification(
        {
          title: "Invalid Discovery Plugin " + discoveryPlugin?.label,
          message: result.errors?.join(", ") ?? `Invalid plugin ${discoveryPlugin?.label}`,
          type: "danger",
        },
        5000
      );
      return;
    }

    if (discoveryPlugin.action === "BackgroundRunner") {
      discoveryPlugin.active = false;
    }
    await db.discoveryPlugin.put(discoveryPlugin);
  };

  const handleRapportsUploadFromText = async (jsonText: string): Promise<void> => {
    const configuration = await Configuration.getConfiguration();

    const parsed = JSON.parse(jsonText);
    const newRapports: Rapport[] = normalizeToArray<Rapport>(parsed);

    await debug(`${newRapports.length} rapports are ready to be processed`);

    for (const rapport of newRapports) {
      await debug(`Processing rapport ${rapport.uuid}`);
      const artifacts: Artifact[] = [];
      const attachments: Attachment[] = [];

      for (const tmpArtifact of rapport?.artifacts ?? []) {
        try {
          const artifact: Artifact = await Artifact.deserialize(tmpArtifact);
          artifacts.push(artifact);
          attachments.push(Artifact.getAttachment(artifact));
        } catch (e) {
          await debug("Artifact error while importing " + String(e), tmpArtifact);
        }
      }

      await db.artifact.bulkPut(artifacts);
      rapport.artifacts = attachments;
    }

    await db.rapport.bulkPut(newRapports);

    const count = await db.rapport.count();
    configuration.screenShotCount = count;
    configuration.updatedOn = getUtcNow();
    await Configuration.setConfiguration(configuration);
  };

  const computeAllowMultiple = useCallback(async (): Promise<boolean> => {
    try {
      const user =
        typeof getUser === "function" ? await Promise.resolve((getUser as any)()) : (getUser as any);
      return user != null;
    } catch {
      return false;
    }
  }, []);

  // ✅ Resolve BEFORE opening so <input multiple> is true when the picker opens
  const handleOpen = useCallback(async () => {
    const canMulti = await computeAllowMultiple();
    setAllowMultiple(canMulti);
    setOpen(true);
  }, [computeAllowMultiple]);

  const inputProps = useMemo(
    () => ({
      accept: ".json,application/json",
      multiple: allowMultiple,
    }),
    [allowMultiple]
  );

  const handleFileChange: InputProps["onChange"] = async (event) => {
    showLoader();
    setIsLoading(true);

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    setError("");

    if (files.length === 0) {
      setIsLoading(false);
      hideLoader();
      return;
    }

    // ✅ Re-check at selection time (no stale state)
    const canMulti = await computeAllowMultiple();
    if (!canMulti && files.length > 1) {
      setError("Please upload only one JSON file (sign in to upload multiple).");
      setIsLoading(false);
      hideLoader();
      input.value = "";
      return;
    }

    for (const f of files) {
      if (!isJsonFile(f)) {
        setError(`Only JSON files are allowed. Invalid file: ${f.name}`);
        setIsLoading(false);
        hideLoader();
        input.value = "";
        return;
      }
    }

    try {
      for (const file of files) {
        const text = await readFileAsText(file);
        if (dataType === "discoveryPlugin") {
          await handleDiscoveryPluginsUploadFromText(text);
        } else {
          await handleRapportsUploadFromText(text);
        }
      }
    } catch (err) {
      await debug(String(err), err);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsLoading(false);
      hideLoader();
      setOpen(false);
      input.value = "";
    }
  };

  return (
    <>
      <IconButton
        key="import-data"
        aria-controls="menu"
        aria-haspopup="true"
        onClick={handleOpen}
        size="large"
      >
        <CloudUpload style={{ zIndex: 1000 }} />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upload Dataset</DialogTitle>

        <DialogContent>
          <Input type="file" inputProps={inputProps} onChange={handleFileChange} />

          {!allowMultiple && (
            <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
              Single-file upload only (sign in to upload multiple files).
            </Typography>
          )}

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="inherit" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
