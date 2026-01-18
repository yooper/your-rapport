import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Stack,
} from "@mui/material";
import type { ScheduledAutomation } from "../../../models/schemas/ScheduledAutomation";
import IconButton from '@mui/material/IconButton';
import HelperPopover from '../../HelperPopover';

type Props = {
  open: boolean;
  title?: string;
  initialValues?: Partial<ScheduledAutomation>;
  onClose: () => void;
  onSave: (values: ScheduledAutomation) => void;
  refresh: () => void;
};

type FormState = Pick<
  ScheduledAutomation,
  "url" | "keepTabOpen" | "isDeepSave" | "crontab"
> &
  Partial<Pick<ScheduledAutomation, "onlySaveOnChange" | "changeDetectors" | "enableImageChangeDetector" | "enableSelectorChangeDetector">>;

const DEFAULT_CRONTAB = "0 * * * * *";

const toNullIfBlank = (v: string) => {
  const s = v.trim();
  return s.length ? s : null;
};

export default function ScheduleAutomationDialog({
  open,
  title = "Schedule Automation",
  initialValues,
  onClose,
  onSave,
  refresh,
}: Props) {
  const [values, setValues] = React.useState<FormState>({
    url: initialValues?.url ?? null,
    keepTabOpen: initialValues?.keepTabOpen ?? false,
    isDeepSave: initialValues?.isDeepSave ?? true,
    crontab: initialValues?.crontab ?? DEFAULT_CRONTAB,
    onlySaveOnChange: initialValues?.onlySaveOnChange ?? true,
    changeDetectors: initialValues?.changeDetectors ?? [],
    enableImageChangeDetector: initialValues?.enableImageChangeDetector ?? true,
    enableSelectorChangeDetector: initialValues?.enableSelectorChangeDetector ?? true,

  });

  React.useEffect(() => {
    if (!open){
      return;
    }

    setValues({
      url: initialValues?.url ?? null,
      keepTabOpen: initialValues?.keepTabOpen ?? false,
      isDeepSave: initialValues?.isDeepSave ?? true,
      crontab: initialValues?.crontab ?? DEFAULT_CRONTAB,
      onlySaveOnChange: initialValues?.onlySaveOnChange ?? true,
      changeDetectors: initialValues?.changeDetectors ?? [],
      enableImageChangeDetector: initialValues?.enableImageChangeDetector ?? true,
      enableSelectorChangeDetector: initialValues?.enableSelectorChangeDetector ?? true,
    });
  }, [open, initialValues]);

  const setField =
    <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) =>
      setValues((p) => ({ ...p, [key]: val }));

  const canSave = React.useMemo(() => {
    const url = values.url?.trim() ?? "";
    return url.length > 0;
  }, [values.url]);

  const handleSave = () => {
    // Ensure required ScheduledAutomation fields exist.
    // If your ScheduledAutomation has more required properties, add them here.
    const payload = {
      ...(initialValues as ScheduledAutomation),
      ...values,
      url: values.url ? values.url.trim() : null,
      crontab: (values.crontab ?? DEFAULT_CRONTAB).trim(),
    } satisfies ScheduledAutomation;

    onSave(payload);
    refresh();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="URL"
            value={values.url ?? ""}
            onChange={(e) => setField("url")(toNullIfBlank(e.target.value))}
            placeholder="https://example.com"
            fullWidth
            autoFocus
          />

          <TextField
            label="Crontab"
            value={values.crontab ?? DEFAULT_CRONTAB}
            onChange={(e) => setField("crontab")(e.target.value)}
            placeholder="0 * * * * *"
            helperText='6-field cron: "sec min hour dom month dow" (e.g., "* 9 * * 1-5"). Default will run once a minute, because of chrome limits.'
            fullWidth
          />


              <FormControlLabel
                control={
                  <Switch
                    disabled={true}
                    checked={!!values.isDeepSave}
                    onChange={(e) => setField("isDeepSave")(e.target.checked)}
                  />
                }
                label="Deep Save"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={!!values.keepTabOpen}
                    onChange={(e) => setField("keepTabOpen")(e.target.checked)}
                  />
                }
                label="Keep tab open"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={!!values.onlySaveOnChange}
                    onChange={(e) => {
                      setField("onlySaveOnChange")(e.target.checked);
                      setField("enableImageChangeDetector")(e.target.checked);
                      setField("enableSelectorChangeDetector")(e.target.checked);
                    }}
                  />
                }
                label={
                <>
                  <IconButton>
                    <HelperPopover message="Enable the change detection algorithms" />
                  </IconButton>
                  <span>Save On Change</span>
                </>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={!!values.enableImageChangeDetector}
                    onChange={(e) =>
                      setField("enableImageChangeDetector")(e.target.checked)
                    }
                  />
                }
                label={
                <>
                  <IconButton>
                    <HelperPopover message="A screenshot comparison is performed. If the screenshots differ the web page is saved." />
                  </IconButton>
                  <span>Detect Image Change</span>
                </>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={!!values.enableSelectorChangeDetector}
                    onChange={(e) =>
                      setField("enableSelectorChangeDetector")(e.target.checked)
                    }
                  />
                }
                label={
                <>
                  <IconButton>
                    <HelperPopover message="Save the page when selectors exist" />
                  </IconButton>
                  <span>Detect Selector Change</span>
                </>
                }
              />



        </Stack>
      </DialogContent>

      <DialogActions>
          <Button onClick={onClose} color="cancel" variant={'contained'}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="secondary" variant={'contained'}>
            Save
          </Button>
      </DialogActions>
    </Dialog>
  );
}
