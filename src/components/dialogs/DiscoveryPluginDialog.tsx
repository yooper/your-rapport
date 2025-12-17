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
import Mustache from 'mustache';
import CopyToClipboardIcon from '../CopyToClipboardIcon';
import { discoveryPluginRunner } from '../../services/discovery_plugin_services';
import { sort_by_key } from '../../utilities/transformers';
import { hideLoader, showLoader, processNotification } from '../../utilities/loaders';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';
import { Selector } from '../../models/schemas/Selector';
import { IRapport } from '../../types';
import SearchDiscoveryPluginLayout from '../layouts/SearchDiscoveryPluginLayout';


interface DiscoveryPluginDialogProps {
  selectorValue: string;
  rapport: IRapport;
  plugins: DiscoveryPlugin[];
  title: string;
  uxType: 'chip' | 'icon';
  refreshRows: any;
}

const DiscoveryPluginDialog: React.FC<DiscoveryPluginDialogProps> = ({
  selectorValue,
  rapport,
  plugins,
  title,
  uxType,
  refreshRows
}) => {
  const [open, setOpen] = useState(false);

  Mustache.escape = (text: string) => text;
  sort_by_key(plugins, 'label');
  const iconMap: Record<string, React.JSX.Element> = {
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
          key={`${title}-${uxType}-${rapport.uuid}`}
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
        fullWidth={true}
        maxWidth={'lg'}
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
                    record={{ selectorValue: selectorValue }}
                    copyFieldName={'selectorValue'}
                  />
                </Tooltip>
              </Typography>

              <SearchDiscoveryPluginLayout
                groupNames={groupNames}
                plugins={plugins}
                selectorValue={selectorValue}
                rapport={rapport}/>

            </div>
          </form>
        </DialogContent>
        <DialogActions />
      </Dialog>
    </Fragment>
  );
};

export default DiscoveryPluginDialog;
