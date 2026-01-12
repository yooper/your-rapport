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
  Partial<Pick<ScheduledAutomation, "onlySaveOnChange" | "changeDetectors">>;

const DEFAULT_CRONTAB = "* * * * *";

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
    isDeepSave: initialValues?.isDeepSave ?? false,
    crontab: initialValues?.crontab ?? DEFAULT_CRONTAB,
    onlySaveOnChange: initialValues?.onlySaveOnChange ?? false,
    changeDetectors: initialValues?.changeDetectors ?? [],
  });

  React.useEffect(() => {
    if (!open) return;

    setValues({
      url: initialValues?.url ?? null,
      keepTabOpen: initialValues?.keepTabOpen ?? false,
      isDeepSave: initialValues?.isDeepSave ?? false,
      crontab: initialValues?.crontab ?? DEFAULT_CRONTAB,
      onlySaveOnChange: initialValues?.onlySaveOnChange ?? false,
      changeDetectors: initialValues?.changeDetectors ?? [],
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
            placeholder="* * * * *"
            helperText='5-field cron: "min hour dom month dow" (e.g., "0 9 * * 1-5"). Default is run once a minute.'
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={!!values.isDeepSave}
                onChange={(e) => setField("isDeepSave")(e.target.checked)}
              />
            }
            label="Deep save"
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
                disabled={true}
                checked={!!values.onlySaveOnChange}
                onChange={(e) =>
                  setField("onlySaveOnChange")(e.target.checked)
                }
              />
            }
            label="Only save when changes detected"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
