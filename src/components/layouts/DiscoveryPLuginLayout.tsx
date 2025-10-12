import React from "react";
import Grid from "@mui/material/Grid";
import FieldMappingForm from "../forms/discovery-plugins/FieldMappingForm";
import DiscoveryPluginAdvancedForm from "../forms/discovery-plugins/DiscoveryPluginAdvancedForm";
import DiscoveryPluginBasicForm from "../forms/discovery-plugins/DiscoveryPluginBasicForm";
import GroupHomeSupportForm from "../forms/discovery-plugins/GroupHomeSupportForm";
import HeaderMappingForm from "../forms/discovery-plugins/HeaderMappingForm";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface DiscoveryPluginRecord {
  [key: string]: any;
}

interface DiscoveryPluginLayoutProps {
  record: DiscoveryPluginRecord;
  setRecord: (updater: (prev: DiscoveryPluginRecord) => DiscoveryPluginRecord) => void;
  apiKeys: Record<string, unknown>;
  pluginTypes: string[];
  setPluginTypes: (types: string[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}


const DiscoveryPluginLayout: React.FC<DiscoveryPluginLayoutProps> = ({
  record,
  setRecord,
  apiKeys,
  pluginTypes,
  setPluginTypes,
}) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: '100%' }}
    >
      <Tabs
        orientation="vertical"
        variant="fullWidth"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}
      >
        <Tab label="Basic" {...a11yProps(0)} />
        <Tab label="Advanced" {...a11yProps(1)} />
        <Tab label="Field Mappings" {...a11yProps(2)} />
        <Tab label="Header Mappings" {...a11yProps(3)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <DiscoveryPluginBasicForm
          pluginTypes={pluginTypes}
          setPluginTypes={setPluginTypes}
          record={record}
          setRecord={setRecord}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <DiscoveryPluginAdvancedForm
            record={record}
            setRecord={setRecord}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <FieldMappingForm
            apiKeys={[]}
            record={record}
            setRecord={setRecord}
        />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <HeaderMappingForm
            record={record}
            setRecord={setRecord}
        />
      </TabPanel>

      <TabPanel value={value} index={4}>
        <GroupHomeSupportForm
            record={record}
            setRecord={setRecord}
        />
      </TabPanel>
    </Box>
  );

};

export default DiscoveryPluginLayout;


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
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}
