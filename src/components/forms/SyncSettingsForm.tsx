import * as React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import {
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import HelperPopover from "../HelperPopover";
import { showLoader, hideLoader } from "../../utilities/loaders";
import { Configuration, IConfiguration } from "../../models/schemas/Configuration";

/**
 * If these fields already exist on IConfiguration, keep them there.
 * This type is just to ensure this form knows the keys exist.
 */
export type AppConfig = IConfiguration & {
  syncBackgroundMode: "async" | string;
  syncBackgroundEnabled: boolean;
  syncBackgroundHardDelete: boolean;
};

type ConfigKey = keyof AppConfig;

type SettingBase<K extends ConfigKey = ConfigKey> = {
  key: K;
  label: string;
  helper?: string;
  disabled?: boolean;
};

type ToggleSetting<K extends ConfigKey = ConfigKey> = SettingBase<K> & {
  kind: "toggle";
  afterUpdate?: (value: boolean, cfg: AppConfig) => void | Promise<void>;
};

type SelectSetting<K extends ConfigKey = ConfigKey> = SettingBase<K> & {
  kind: "select";
  options: Array<{ label: string; value: string }>;
  afterUpdate?: (value: string, cfg: AppConfig) => void | Promise<void>;
};

type ActionSetting = {
  kind: "action";
  label: string;
  tooltip?: string;
  disabled?: boolean;
  onClick: (cfg: AppConfig) => void | Promise<void>;
};

export type ConfigSetting = ToggleSetting | SelectSetting | ActionSetting;

export type SyncBackgroundSettingsFormProps = {
  settings: ConfigSetting[];
};

const asBool = (v: unknown): boolean => !!v;

const DEFAULTS: Pick<
  AppConfig,
  "syncBackgroundMode" | "syncBackgroundEnabled" | "syncBackgroundHardDelete"
> = {
  syncBackgroundMode: "async",
  syncBackgroundEnabled: false,
  syncBackgroundHardDelete: true,
};

export default function SyncBackgroundSettingsForm({
  settings,
}: SyncBackgroundSettingsFormProps) {
  const [cfg, setCfg] = React.useState<AppConfig>({ ...DEFAULTS } as AppConfig);
  const cfgRef = React.useRef<AppConfig>(cfg);

  const [isLoading, setIsLoading] = React.useState(true);

  // keep ref in sync with state
  React.useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  React.useEffect(() => {
    (async () => {
      showLoader();
      setIsLoading(true);

      const loaded = (await Configuration.getConfiguration()) as AppConfig | null;
      const merged = { ...DEFAULTS, ...(loaded ?? {}) } as AppConfig;

      setCfg(merged);
      cfgRef.current = merged;

      hideLoader();
      setIsLoading(false);
    })();
  }, []);

  const setConfigValue = React.useCallback(
    async <K extends ConfigKey>(key: K, value: AppConfig[K]): Promise<AppConfig> => {
      const next = { ...cfgRef.current, [key]: value } as AppConfig;

      // update local state immediately
      setCfg(next);
      cfgRef.current = next;

      // persist
      await Configuration.setConfigurationValue(String(key), value);

      return next;
    },
    []
  );

  const renderLabel = (label: string, helper?: string) => (
    <Typography variant="body1" component="div" color="white">
      {helper ? (
        <IconButton size="small">
          <HelperPopover message={helper} />
        </IconButton>
      ) : null}
      {label}
    </Typography>
  );

  const renderToggle = (s: ToggleSetting) => (
    <Grid key={String(s.key)} xs={12}>
      <FormControlLabel
        disabled={s.disabled}
        id={String(s.key)}
        name={String(s.key)}
        control={
          <Switch
            color="primary"
            name={String(s.key)}
            checked={asBool(cfg[s.key])}
            onChange={async (_e, checked) => {
              const next = await setConfigValue(
                s.key,
                checked as AppConfig[typeof s.key]
              );
              await s.afterUpdate?.(checked, next);
            }}
          />
        }
        label={renderLabel(s.label, s.helper)}
        labelPlacement="end"
      />
    </Grid>
  );

  const renderSelect = (s: SelectSetting) => {
    const labelId = `${String(s.key)}-label`;

    return (
      <Grid key={String(s.key)} xs={12}>
        <FormControl fullWidth size="small" disabled={s.disabled}>
          <InputLabel id={labelId}>{s.label}</InputLabel>

          <Select
            labelId={labelId}
            id={String(s.key)}
            label={s.label}
            value={String(cfg[s.key] ?? "")}
            onChange={async (e: SelectChangeEvent) => {
              const value = e.target.value;
              const next = await setConfigValue(
                s.key,
                value as AppConfig[typeof s.key]
              );
              await s.afterUpdate?.(value, next);
            }}
          >
            {s.options.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>

          {s.helper ? (
            <Typography variant="caption" color="white" sx={{ mt: 1, opacity: 0.85 }}>
              {s.helper}
            </Typography>
          ) : null}
        </FormControl>
      </Grid>
    );
  };

  const renderAction = (s: ActionSetting, idx: number) => {
    const btn = (
      <Button variant="contained" disabled={s.disabled} onClick={() => s.onClick(cfgRef.current)}>
        {s.label}
      </Button>
    );

    return (
      <Grid key={`action-${idx}-${s.label}`} xs={12}>
        {s.tooltip ? <Tooltip title={s.tooltip}>{btn}</Tooltip> : btn}
      </Grid>
    );
  };

  if (isLoading) return <div />;

  return (
    <form noValidate>
      <Grid container justifyContent="flex-end" spacing={2}>
        {settings.map((s, idx) =>
          s.kind === "toggle"
            ? renderToggle(s)
            : s.kind === "select"
              ? renderSelect(s)
              : renderAction(s, idx)
        )}
      </Grid>
    </form>
  );
}

/**
 * ✅ Your requested options
 */
export const syncBackgroundSettings: ConfigSetting[] = [
    {
    kind: "toggle",
    key: "syncBackgroundEnabled",
    label: "Enable Background Sync",
    helper: "Turns background sync on/off.",
  },
  {
    kind: "select",
    key: "syncBackgroundMode",
    label: "Background Sync Mode",
    helper: "Controls how background sync runs.",
    options: [{ label: "Sync", value: "sync" }],
  },
  {
    kind: "toggle",
    key: "syncBackgroundHardDelete",
    label: "Hard Delete on Sync",
    helper: "Permanently delete items when syncing.",
  },
  {
    kind: "select",
    key: "syncBackgroundArtifactResolution",
    label: "Artifact Asset Resolution",
    helper: "High Res exports all artifacts (more data stored), Low Res does not sync artifacts (less data stored).",
    options: [{ label: "High Resolution", value: "highRes" }],
  },

  {
    kind: "select",
    key: "syncBackgroundPath",
    label: "Sync Directory",
    helper: "This path is relative to where your browser downloads files. By default a sub directory is created for your rapport data.",
    options: [{ label: "Default", value: "your_rapport/sync/" }],
  },

];

