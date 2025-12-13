import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';

import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ListItemIcon } from '@mui/material';
import { db } from '../../models/db/dexieDb';
import BulkAutomationUrl from '../../models/schemas/BulkAutomationUrl';
import { IRapport } from '../../types';

export type DiscoveryPlugin = {
  uuid: string;

  groupName?: string | null;

  label?: string | null;
  labels?: string[] | null;
  description?: string | null;

  url?: string | null;

  // These names vary across implementations; we’ll support common ones.
  action?: string | null; // e.g. "createTab"
  method?: string | null; // e.g. "GET"
  httpMethod?: string | null; // e.g. "GET"
  request?: { method?: string | null } | null; // e.g. { method: "GET" }
};

type SearchDiscoveryPluginLayoutProps = {
  groupNames: string[];
  plugins: DiscoveryPlugin[];
  rapport: IRapport,
  selectorValue: string

  /**
   * Wire this to your BulkAutomationUrl enqueue logic.
   * It will only be called when the plugin qualifies (createTab + GET).
   */
  onQueueAutomation?: (plugin: DiscoveryPlugin) => void;
};

export default function SearchDiscoveryPluginLayout({
  groupNames,
  plugins,
  rapport,
  selectorValue,
  onQueueAutomation,
}: SearchDiscoveryPluginLayoutProps) {
  const [value, setValue] = React.useState<number>(0);
  const [query, setQuery] = React.useState<string>('');
  const [queuedPluginUuids, setQueuedPluginUuids] = React.useState<Set<string>>(
    () => new Set()
  );

  React.useEffect(() => {
    setValue((v) => Math.min(v, Math.max(groupNames.length - 1, 0)));
  }, [groupNames.length]);

  const normalizedQuery = React.useMemo(() => query.trim().toLowerCase(), [query]);

  const filteredPlugins = React.useMemo(() => {
    if (!normalizedQuery) return plugins;

    return plugins.filter((p) => {
      const labelText =
        (p.label ?? '') + ' ' + (Array.isArray(p.labels) ? p.labels.join(' ') : '');
      const haystack = `${labelText} ${p.description ?? ''} ${p.url ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [plugins, normalizedQuery]);

  const countsByGroup = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of groupNames) counts[g] = 0;

    for (const p of filteredPlugins) {
      const g = p.groupName ?? '';
      if (g && g in counts) counts[g] += 1;
    }
    return counts;
  }, [filteredPlugins, groupNames]);

  const pluginsForSelectedGroup = React.useMemo(() => {
    const groupName = groupNames[value];
    if (!groupName) return [];
    return filteredPlugins.filter((p) => (p.groupName ?? '') === groupName);
  }, [filteredPlugins, groupNames, value]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => setValue(newValue);

  const getHttpMethod = (p: DiscoveryPlugin): string =>
    (p.httpMethod ?? p.method ?? p.request?.method ?? '').toString().trim().toLowerCase();

  const isAutomationEligible = (p: DiscoveryPlugin): boolean => {
    const action = (p.action ?? '').toString().trim().toLowerCase();
    const method = getHttpMethod(p);
    return action === 'createtab' && method === 'get';
  };

  const openInSeparateWindow = (url: string) => {
    // Chrome extension case
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = (globalThis as any).chrome;
      if (c?.windows?.create) {
        c.windows.create({ url, focused: true, type: 'normal' });
        return;
      }
    } catch {
      // fall back below
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleQueueAutomation = async(p: DiscoveryPlugin) => {
    if (!isAutomationEligible(p)) {
      return;
    }

    if(await db.discoveryPlugin.where({url: p.url}).count()) {
      return;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Search plugins"
          placeholder="Search label, description, or URL…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>

      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 500 }}>
        <Tabs
          orientation="vertical"
          variant="fullWidth"
          value={value}
          onChange={handleChange}
          aria-label="Discovery Plugin Search"
          sx={{
            borderRight: 1,
            borderColor: 'divider',
            height: '100%',
            minWidth: 260,
          }}
        >
          {groupNames.map((groupName, index) => (
            <Tab
              key={groupName}
              label={`${groupName} (${countsByGroup[groupName] ?? 0})`}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>

        <TabPanel value={value} index={value}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {groupNames[value] ?? 'Group'}
          </Typography>

          {pluginsForSelectedGroup.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              No plugins match this filter.
            </Typography>
          ) : (
            <List dense>
            {pluginsForSelectedGroup.map((p) => {
              const primary = p.label ?? (p.labels?.[0] ?? p.uuid);
              const secondary = p.description ?? p.url ?? '';
              const url = p.url ?? '';
              const eligible = isAutomationEligible(p);
              const queued = queuedPluginUuids.has(p.uuid);

              return (
                <ListItem key={p.uuid} divider alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 44, mt: 0.25 }}>
                    <Stack direction="row" spacing={0.5}>
                      {/* Queue automation icon (only if eligible) */}
                      {eligible && (
                        <Tooltip title={queued ? 'Queued for automation' : 'Queue for automation'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleQueueAutomation(p)}
                              disabled={queued}
                              aria-label="queue for automation"
                            >
                              <PlaylistAddIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {/* Open in separate window icon */}
                      <Tooltip title={url ? 'Open in new window' : 'No URL'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => url && openInSeparateWindow(url)}
                            disabled={!url}
                            aria-label="open in new window"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </ListItemIcon>

                  <ListItemText primary={primary} secondary={secondary} />
                </ListItem>
              );
            })}

            </List>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
      style={{ flex: 1 }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}
