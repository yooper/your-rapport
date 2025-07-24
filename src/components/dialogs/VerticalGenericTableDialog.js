import React, { useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import RoomIcon from '@mui/icons-material/Room';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

import { anyProperty, hideLoader, showLoader } from '../../common/utilities';

export default function VerticalGenericTableDialog(props) {
  const { selectedRecord, title, iconType, approvedFields } = props;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [color, setColor] = useState('black');

  useEffect(() => {
    const result = anyProperty(selectedRecord, approvedFields);
  }, [selectedRecord, approvedFields]); // Dependencies: React will re-run this when obj or keys change.

  /**
   * Only fetch data if a URL is specified
   * @returns {Promise<void>}
   */
  async function fetchData() {
    setIsLoading(true);
    showLoader();

    hideLoader();
    setIsLoading(false);
  }

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = async () => {
    setOpen(true);
  };

  /**
   * Only display the approved fields
   * @param obj
   * @param approvedFields
   * @returns {{}|*}
   */
  function removeArrayAndObjectProperties(obj, approvedFields = []) {
    if (approvedFields.length > 0) {
      const orderedObj = {};
      // Iterate through each property in the approved properties array
      approvedFields.forEach((fieldName) => {
        if (fieldName in obj) {
          // Add the property to the ordered object if it exists in the original object
          orderedObj[fieldName] = obj[fieldName];
        }
      });
      return orderedObj;
    }
    // else
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Check if the property is an array or an object
        if (Array.isArray(obj[key]) || !(obj[key] instanceof Date)) {
          delete obj[key];
        }
      }
    });
    return obj;
  }

  /**
   * Function to determine which icon to use based on iconType or other props
   * TODO move into a separate function
   */
  const getIcon = () => {
    switch (iconType) {
      case 'HelpOutlineIcon':
        return HelpOutlineIcon;
      case 'MailOutlineOutlinedIcon':
        return MailOutlineOutlinedIcon;
      case 'MapOutlinedIcon':
        return MapOutlinedIcon;
      case 'RoomIcon':
        return RoomIcon;
      case 'RoomOutlinedIcon':
        return 'RoomOutlinedIcon';
      case 'CalendarMonthOutlinedIcon':
        return CalendarMonthOutlinedIcon;
      case 'InfoOutlinedIcon':
        return InfoOutlinedIcon;
      case 'VisibilityOutlinedIcon':
      default:
        return VisibilityOutlinedIcon;
    }
  };

  /**
   * Adds spaces between the pascal case field name's
   * @param input
   * @returns {*}
   */
  const pascalCaseToSpaces = (input) => {
    return input.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^([A-Z])/, '$1');
  };

  let Icon = getIcon(); // Determine the icon component
  return (
    <>
      <Tooltip title={title}>
        <Icon onClick={handleClick} sx={{ pr: 1.0, color: color }} />
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth={false}
        maxWidth={'lg'}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Paper>
              <TableContainer component={Paper}>
                <Table aria-label="vertical table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Field Name</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(
                      removeArrayAndObjectProperties(
                        selectedRecord,
                        approvedFields
                      )
                    ).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell component="th" scope="row">
                          {pascalCaseToSpaces(key)}
                        </TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained">
            Okay
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
