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
import { IRapport } from '../../types';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';
import { discoveryPluginRunner } from '../../services/discovery_plugin_services';
import { DirectionsRun } from '@mui/icons-material';



type SearchDiscoveryPluginLayoutProps = {
  groupNames: string[];
  plugins: DiscoveryPlugin[];
  rapport: IRapport,
  selectorValue: string
};

export default function SearchDiscoveryPluginLayout({
  groupNames,
  plugins,
  rapport,
  selectorValue,
}: SearchDiscoveryPluginLayoutProps) {
  const [value, setValue] = React.useState<number>(0);
  const [query, setQuery] = React.useState<string>('');


  React.useEffect(() => {
    setValue((v) => Math.min(v, Math.max(groupNames.length - 1, 0)));
  }, [groupNames.length]);

  const normalizedQuery = React.useMemo(() => query.trim().toLowerCase(), [query]);

  const filteredPlugins = React.useMemo(() => {
    if (!normalizedQuery) return plugins;

    return plugins.filter((p) => {
      const labelText = p.label;
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

  const isAutomationEligible = (p: DiscoveryPlugin): boolean => {
    return false;
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
          variant="scrollable"
          value={value}
          scrollButtons="auto"
          onChange={handleChange}
          aria-label="Discovery Plugin Search"
          sx={{
            borderRight: 1,

            borderColor: 'divider',
            height: '100%',
            minWidth: 260,
            maxHeight: '100%',
            overflowY: 'auto'
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
              const primary = p.label;
              const secondary = p.description ?? p.url ?? '';
              const url = p.url;
              const eligible = isAutomationEligible(p);

              return (
                <ListItem key={p.uuid} divider alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 44, mt: 0.25 }}>
                    <Stack direction="row" spacing={0.5}>
                      {/* Queue automation icon (only if eligible) */}
                      {eligible && (
                        <Tooltip title={false ? 'Queued for automation' : 'Queue for automation'}>
                          <span>
                            <IconButton
                              disabled={true}
                              size="small"
                              onClick={() => handleQueueAutomation(p)}
                              aria-label="queue for automation"
                            >
                              <PlaylistAddIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {/* Open in separate window icon */}
                      <Tooltip title={'Run the discovery plugin on the selector value or record'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => discoveryPluginRunner(p, rapport, selectorValue)}
                            disabled={!url}
                            aria-label="open in new window"
                          >
                            {
                              ['CreateTab','SubmitForm'].includes(p.pluginType) ? <OpenInNewIcon fontSize="small" /> : <DirectionsRun fontSize="small" />
                            }

                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </ListItemIcon>

                  <ListItemText primary={primary} secondary={secondary} onClick={() => discoveryPluginRunner(p, rapport, selectorValue)} />
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
