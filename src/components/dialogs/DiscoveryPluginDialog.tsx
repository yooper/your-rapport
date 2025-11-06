import React, { Fragment, useState } from 'react';
import { getSelectorTypeMap } from '../../utilities/loaders'
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
  ListItemText, Tooltip,
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
import AddToQueueIcon from '@mui/icons-material/AddToQueue';
import BulkAutomationUrl from '../../models/schemas/BulkAutomationUrl';
import Mustache from 'mustache';
import CopyToClipboardIcon from '../CopyToClipboardIcon';
import { discoveryPluginRunner } from '../../services/discovery_plugin_services';
import { sort_by_key } from '../../utilities/transformers';
import { hideLoader, showLoader, processNotification } from '../../utilities/loaders';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';
import { Selector } from '../../models/schemas/Selector';
import HelperPopover from '../HelperPopover';


interface RecordData {
  Uuid: string;
  [key: string]: any;
}

interface DiscoveryPluginDialogProps {
  selectorValue: string;
  record: RecordData;
  plugins: DiscoveryPlugin[];
  title: string;
  uxType: 'chip' | 'icon';
  refreshRows: any;
}

const DiscoveryPluginDialog: React.FC<DiscoveryPluginDialogProps> = ({
  selectorValue,
  record,
  plugins,
  title,
  uxType,
  refreshRows
}) => {
  const [open, setOpen] = useState(false);

  Mustache.escape = (text: string) => text;
  sort_by_key(plugins, 'label');
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
    await Selector.delete(new Selector(selectorValue, 'not applicable'));
    refreshRows()
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
                  <Tooltip title={'Copy the selected selector value into your clip board'}>
                  <CopyToClipboardIcon
                    record={{ pluginName: selectorValue }}
                    copyFieldName={'pluginName'}
                  />
                </Tooltip>
              </Typography>

              <List dense>
                <ListItem
                  dense
                  key={`plugin-${selectorValue}-open-all`}
                  className="clickable"
                  onClick={() => {
                    plugins.forEach((plugin) =>
                      !['Download', 'Live Page'].includes(plugin.label)
                        ? discoveryPluginRunner(plugin, record, selectorValue)
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
                        >
                          <ListItemIcon>
                            <IconButton>
                            <HelperPopover message={plugin.description}/>
                            </IconButton>
                            <Tooltip title={'Queue item into the bulk automation collection'}>
                              <IconButton disabled={!plugin.url || plugin.action !== 'CreateTab'}>
                                <AddToQueueIcon onClick={() => {
                                  // TODO: disable plugin click after the item has been queued
                                  // assign the plugin value
                                  const dp = {...plugin,...{selectorValue: selectorValue}}
                                  const url = Mustache.render(dp.url, dp);
                                    BulkAutomationUrl.queueUrl(url).then(() => {
                                      processNotification({title: 'Url queued', message: 'The discovery plugin url has been placed in the automation queue', type:'info'})
                                    })
                                }}/>
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={'Open the website using the discovery plugin and rapport attributes'}>
                              <IconButton
                                className="clickable"
                                onClick={() => { discoveryPluginRunner(plugin, record, selectorValue)}}
                              >
                                <OpenInNewIcon
                                />
                              </IconButton>
                            </Tooltip>

                          </ListItemIcon>
                          <ListItemText
                            primary={plugin.label}
                              className="clickable"
                              onClick={() => { discoveryPluginRunner(plugin, record, selectorValue)}}
                          />
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
