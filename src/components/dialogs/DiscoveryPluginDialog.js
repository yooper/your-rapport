import React, {Fragment, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import AppsIcon from "@mui/icons-material/Apps";
import {Avatar, List, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HomeIcon from '@mui/icons-material/Home';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import ArticleIcon from '@mui/icons-material/Article';
import DomainIcon from '@mui/icons-material/Domain';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import PatternIcon from '@mui/icons-material/Pattern';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import ChurchIcon from '@mui/icons-material/Church';
import TagIcon from '@mui/icons-material/Tag';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {CalendarMonth} from "@mui/icons-material";
import Mustache from "mustache/mustache.mjs";
import Typography from "@mui/material/Typography";
import {sortByField} from "../../utilities/transformers";
import {getSelectorTypeMap, hideLoader, showLoader} from "../../utilities/loaders";
import {deleteRecord} from "../../models/db/local";
import CopyToClipboardIcon from "../CopyToClipboardIcon";
import discoveryPluginRunner from "../../services/discovery_plugin_services";


/*
 A generalized modal for the discovery plugins
 */
export default function DiscoveryPluginDialog(props)
{
  const { pluginValue, record, plugins, title, uxType } = props
  const [open, setOpen] = useState(false)
  //do not escape Mustache output
  Mustache.escape = function (text) { return text; }

  sortByField(plugins, 'label')

  /**
   * Map selector type to an icon
   * @type {{date: JSX.Element, address: JSX.Element, occupation: JSX.Element, associate: JSX.Element, content: JSX.Element, religion: JSX.Element, ethereum: JSX.Element, application: JSX.Element, phone: JSX.Element, dob: JSX.Element, domain: JSX.Element, organization: JSX.Element, name: JSX.Element, tag: JSX.Element, event: JSX.Element, family: JSX.Element, keyword: JSX.Element, bitcoin: JSX.Element, email: JSX.Element, username: JSX.Element}}
   */
  const iconMap = {
    address : <Avatar><HomeIcon sx={{ fontSize: "small" }} /></Avatar>,
    application : <Avatar><AttachFileIcon sx={{ fontSize: "small" }} /></Avatar>,
    associate: <Avatar><PersonIcon sx={{ fontSize: "small" }} /></Avatar>,
    bitcoin: <Avatar><CurrencyBitcoinIcon sx={{ fontSize: "small" }} /></Avatar>,
    content: <Avatar><ArticleIcon sx={{ fontSize: "small" }} /></Avatar>,
    date: <Avatar><CalendarMonth/></Avatar>,
    dob: <Avatar><CalendarMonth/></Avatar>,
    domain: <Avatar><DomainIcon sx={{ fontSize: "small" }} /></Avatar>,
    email: <Avatar><EmailIcon sx={{ fontSize: "small" }} /></Avatar>,
    ethereum: <Avatar><CurrencyBitcoinIcon sx={{ fontSize: "small" }} /></Avatar>,
    event: <Avatar><EventIcon sx={{ fontSize: "small" }} /></Avatar>,
    family: <Avatar><PersonIcon sx={{ fontSize: "small" }} /></Avatar>,
    keyword: <Avatar><PatternIcon sx={{ fontSize: "small" }} /></Avatar>,
    name: <Avatar><PersonIcon sx={{ fontSize: "small" }} /></Avatar>,
    occupation: <Avatar><WorkIcon sx={{ fontSize: "small" }} /></Avatar>,
    organization: <Avatar><BusinessIcon sx={{ fontSize: "small" }} /></Avatar>,
    phone: <Avatar><SmartphoneIcon sx={{ fontSize: "small" }} /></Avatar>,
    religion: <Avatar><ChurchIcon sx={{ fontSize: "small" }} /></Avatar>,
    username: <Avatar><PersonIcon sx={{ fontSize: "small" }} /></Avatar>,
    tag: <Avatar><TagIcon sx={{ fontSize: "small" }} /></Avatar>
  }

  const getIcon = (pluginType) => {
    if(pluginType in iconMap)
    {
      return iconMap[pluginType]
    }
    return  <Avatar><QuestionMarkIcon sx={{ fontSize: "small" }} /></Avatar>
  }

  let groupNames = []
  if(plugins && plugins.length > 1)
  {
    groupNames = Array.from(new Set(plugins.map((plugin) => { return plugin['groupName'] })))
    groupNames.sort()
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleDelete = async(pluginValue) => {
    showLoader()
    await deleteRecord('selectors', 'key', {key: pluginValue});
    hideLoader();
  }

  return (
    <Fragment>
        {
            uxType === 'chip' ?
                <Chip
                    avatar={getIcon(title)}
                    key={`${title}-${uxType}-${record.uuid}`}
                    variant={'outlined'}
                    label={pluginValue}
                    color="primary"
                    onClick={() => {
                        setOpen(true)
                    }}
                    style={{zIndex:10000, margin: '3px'}}
                    size="small"
                    onDelete={Object.keys(getSelectorTypeMap()).includes(title) ? async() => { await handleDelete(pluginValue) } : null}
                />
            :
                <IconButton
                key={`${title}-${uxType}`}
                aria-controls={`${pluginValue ?? 'plugin'}-menu`}
                aria-haspopup="true"
                onClick={() => setOpen(true)}
                size="large">
                <AppsIcon style={{zIndex:1000}} />
                </IconButton>
        }

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{title.charAt(0).toUpperCase() + title.slice(1)} Discovery Plugins</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <form>
            <div>
              <Typography variant="h5">{pluginValue}
                <CopyToClipboardIcon
                      record={{pluginName: pluginValue}}
                      copyFieldName={'pluginName'}
                  />
              </Typography>
              <List dense={true}>
                <ListItem
                    dense={true}
                    key={`plugin-${pluginValue}-open-all`}
                    className={'clickable'}
                    onClick={() => {
                      // do not auto open the download or live page options
                      plugins.forEach(plugin => !['Download', 'Live Page'].includes(plugin.label) ? discoveryPluginRunner(plugin, record, pluginValue) : null)
                    }}
                >
                  <ListItemIcon>
                    <OpenInNewIcon />
                  </ListItemIcon>
                  <ListItemText
                      primary={'Open All'}
                  />
                </ListItem>
              </List>

              {groupNames && groupNames.map((groupName) => (
                  <div>
                  <h4>{groupName}</h4>
                  <List dense={true}>
                    {plugins && plugins.filter( (plugin) => plugin.groupName === groupName).map((plugin) => (
                        <ListItem
                            dense={true}
                            key={`plugin-${plugin.pluginType}-${plugin.uuid}`}
                            className={'clickable'}
                            onClick={() => {
                              discoveryPluginRunner(plugin, record, pluginValue)
                            }}
                        >
                          <ListItemIcon>
                            <OpenInNewIcon />
                          </ListItemIcon>
                          <ListItemText
                              primary={plugin.label}
                          />
                        </ListItem>
                    ))}
                  </List>
                  </div>
              ))
              }
            </div>
          </form>
        </DialogContent>
        <DialogActions>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}