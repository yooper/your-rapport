import React, { Fragment, useState } from 'react';
import {
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Apps as AppsIcon,
  OpenInNew as OpenInNewIcon,
  Home as HomeIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  Article as ArticleIcon,
  Domain as DomainIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Pattern as PatternIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Smartphone as SmartphoneIcon,
  Church as ChurchIcon,
  Tag as TagIcon,
  QuestionMark as QuestionMarkIcon,
  CalendarMonth,
} from '@mui/icons-material';

import Mustache from 'mustache';
import CopyToClipboardIcon from '../CopyToClipboardIcon';
import discoveryPluginParser from '../../services/discovery_plugin_services';
import { sort_by_key } from '../../utilities/transformers';
import { hideLoader, showLoader } from '../../utilities/loaders';

interface Plugin {
  Label: string;
  PluginType: string;
  Uuid: string;
  GroupName: string;
}

interface RecordData {
  Uuid: string;
  [key: string]: any;
}

interface DiscoveryPluginDialogProps {
  selectorValue: string;
  record: RecordData;
  plugins: Plugin[];
  title: string;
  uxType: 'chip' | 'icon';
}

const DiscoveryPluginDialog: React.FC<DiscoveryPluginDialogProps> = ({
  selectorValue,
  record,
  plugins,
  title,
  uxType,
}) => {
  const [open, setOpen] = useState(false);

  Mustache.escape = (text: string) => text;
  sort_by_key(plugins, 'Label');

  const getSelectorTypeMap = () => ({
    address: 'Address',
    associate: 'Associate',
    bitcoin: 'Bitcoin Address',
    dob: 'Date of Birth',
    date: 'Date',
    email: 'Email',
    ethereum: 'Ethereum Address',
    event: 'Event',
    family: 'Family',
    keyword: 'Keyword',
    name: 'Name',
    occupation: 'Occupation',
    organization: 'Organization',
    phone: 'Phone',
    religion: 'Religion',
    username: 'Username',
  });

  const iconMap: Record<string, JSX.Element> = {
    address: (
      <Avatar>
        <HomeIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    application: (
      <Avatar>
        <AttachFileIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    associate: (
      <Avatar>
        <PersonIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    bitcoin: (
      <Avatar>
        <CurrencyBitcoinIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    content: (
      <Avatar>
        <ArticleIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    date: (
      <Avatar>
        <CalendarMonth />
      </Avatar>
    ),
    dob: (
      <Avatar>
        <CalendarMonth />
      </Avatar>
    ),
    domain: (
      <Avatar>
        <DomainIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    email: (
      <Avatar>
        <EmailIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    ethereum: (
      <Avatar>
        <CurrencyBitcoinIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    event: (
      <Avatar>
        <EventIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    family: (
      <Avatar>
        <PersonIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    keyword: (
      <Avatar>
        <PatternIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    name: (
      <Avatar>
        <PersonIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    occupation: (
      <Avatar>
        <WorkIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    organization: (
      <Avatar>
        <BusinessIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    phone: (
      <Avatar>
        <SmartphoneIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    religion: (
      <Avatar>
        <ChurchIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    username: (
      <Avatar>
        <PersonIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
    tag: (
      <Avatar>
        <TagIcon sx={{ fontSize: 'small' }} />
      </Avatar>
    ),
  };

  const getIcon = (pluginType: string): JSX.Element => {
    return (
      iconMap[pluginType] || (
        <Avatar>
          <QuestionMarkIcon sx={{ fontSize: 'small' }} />
        </Avatar>
      )
    );
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (value: string) => {
    showLoader();
    await fetch_wrapper(`{{WebHost}}v1/selector?Name=${value}`, {
      method: 'DELETE',
    });
    hideLoader();
  };

  const selectorTypeKeys = Object.keys(getSelectorTypeMap());
  const groupNames = Array.from(
    new Set(plugins?.map((p) => p.groupName))
  ).sort();

  return (
    <Fragment>
      {uxType === 'chip' ? (
        <Chip
          avatar={getIcon(title)}
          key={`${title}-${uxType}-${record.uuid}`}
          variant="outlined"
          label={selectorValue}
          color="primary"
          onClick={() => setOpen(true)}
          style={{ zIndex: 10000, margin: '3px' }}
          size="small"
          onDelete={
            selectorTypeKeys.includes(title)
              ? async () => {
                  await handleDelete(selectorValue);
                }
              : undefined
          }
        />
      ) : (
        <IconButton
          key={`${title}-${uxType}`}
          aria-controls={`${selectorValue ?? 'plugin'}-menu`}
          aria-haspopup="true"
          onClick={() => setOpen(true)}
          size="large"
        >
          <AppsIcon style={{ zIndex: 1000 }} />
        </IconButton>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          {title.charAt(0).toUpperCase() + title.slice(1)} Discovery Plugins
        </DialogTitle>
        <DialogContent>
          <DialogContentText />
          <form>
            <div>
              <Typography variant="h5">
                {selectorValue}
                <CopyToClipboardIcon
                  record={{ pluginName: selectorValue }}
                  copyFieldName={'pluginName'}
                />
              </Typography>

              <List dense>
                <ListItem
                  dense
                  key={`plugin-${selectorValue}-open-all`}
                  className="clickable"
                  onClick={() => {
                    plugins.forEach((plugin) =>
                      !['Download', 'Live Page'].includes(plugin.label)
                        ? discoveryPluginParser(plugin, record, selectorValue)
                        : null
                    );
                  }}
                >
                  <ListItemIcon>
                    <OpenInNewIcon />
                  </ListItemIcon>
                  <ListItemText primary="Open All" />
                </ListItem>
              </List>

              {groupNames.map((groupName) => (
                <div key={`group-${groupName}`}>
                  <h4>{groupName}</h4>
                  <List dense>
                    {plugins
                      .filter((p) => p.groupName === groupName)
                      .map((plugin) => (
                        <ListItem
                          dense
                          key={`plugin-${plugin.pluginType}-${plugin.uuid}`}
                          className="clickable"
                          onClick={() =>
                            discoveryPluginParser(plugin, record, selectorValue)
                          }
                        >
                          <ListItemIcon>
                            <OpenInNewIcon />
                          </ListItemIcon>
                          <ListItemText primary={plugin.label} />
                        </ListItem>
                      ))}
                  </List>
                </div>
              ))}
            </div>
          </form>
        </DialogContent>
        <DialogActions />
      </Dialog>
    </Fragment>
  );
};

export default DiscoveryPluginDialog;
