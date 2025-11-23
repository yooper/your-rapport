import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  SvgIconTypeMap,
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import RoomIcon from '@mui/icons-material/Room';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { anyProperty } from '../../utilities/transformers';

interface VerticalGenericTableDialogProps {
  selectedRecord: Record<string, any>;
  title: string;
  iconType?: string;
  approvedFields: string[];
}

export default function VerticalGenericTableDialog({
  selectedRecord,
  title,
  iconType,
  approvedFields,
}: VerticalGenericTableDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [color, setColor] = useState<string>('primary');

  useEffect(() => {
    const result = anyProperty(selectedRecord, approvedFields);
  }, [selectedRecord, approvedFields]);

  const handleClose = (): void => {
    setOpen(false);
  };

  const handleClick = async (): Promise<void> => {
    setOpen(true);
    // You could fetch here if needed
    // await fetchData();
  };

  function removeArrayAndObjectProperties(
    obj: Record<string, any>,
    approvedFields: string[] = []
  ): Record<string, any> {
    if (approvedFields.length > 0) {
      const orderedObj: Record<string, any> = {};
      approvedFields.forEach((fieldName) => {
        if (fieldName in obj) {
          orderedObj[fieldName] = obj[fieldName];
        }
      });
      return orderedObj;
    }

    const cloned = { ...obj };
    Object.keys(cloned).forEach((key) => {
      if (
        typeof cloned[key] === 'object' &&
        cloned[key] !== null &&
        (Array.isArray(cloned[key]) || !(cloned[key] instanceof Date))
      ) {
        delete cloned[key];
      }
    });
    return cloned;
  }

  const getIcon = (): OverridableComponent<SvgIconTypeMap<{}, 'svg'>> => {
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
        return RoomOutlinedIcon;
      case 'CalendarMonthOutlinedIcon':
        return CalendarMonthOutlinedIcon;
      case 'InfoOutlinedIcon':
        return InfoOutlinedIcon;
      case 'VisibilityOutlinedIcon':
      default:
        return VisibilityOutlinedIcon;
    }
  };

  const pascalCaseToSpaces = (input: string): string => {
    return input.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^([A-Z])/, '$1');
  };

  const Icon = getIcon();

  return (
    <>
      <Tooltip title={title}>
        <Icon onClick={handleClick} sx={{ color }} />
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth={false}
        maxWidth="lg"
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
                        <TableCell>{String(value)}</TableCell>
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
