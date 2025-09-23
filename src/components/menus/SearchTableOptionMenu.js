import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import * as React from 'react';
import { printPdfReport } from '../../utilities/print_service';
import { useState } from 'react';
import JsonAttributeViewerDialog from '../dialogs/JsonAttributeViewerDialog';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  downloadBase64Image,
  downloadJsonData,
} from '../../utilities/transformers';
import AddTagsFormDialog from '../dialogs/search_dashboard/AddTagsFormDialog';

export default function SearchTableOptionMenu(props) {
  const {record, rows, setRows} = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);


  const [openAddTagDialog, setOpenAddTagDialog] = useState(false)

  const [isOpen, setIsOpen] = useState(false);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePrintPdf = () => {
    printPdfReport('basic', { records: [record] });
    handleClose(null);
  };

  const handleDownloadImage = () => {
    downloadBase64Image(record.screenshot, `${record.uuid}.png`);
    handleClose(null);
  };

  const handleDownloadRecord = () => {
    downloadJsonData(record, `your.rapport.${record.uuid}.json`);
    handleClose(null);
  };

  /**
   * Debug the data
   */
  const handleMetadata = () => {
    setIsOpen(true);
    setAnchorEl(null);
  };

  return (
    <div>
      <MoreVertIcon
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      ></MoreVertIcon>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={async() => { setOpenAddTagDialog(true); handleClose(); }}>Modify Tag(s)</MenuItem>
        <MenuItem onClick={handlePrintPdf}>Print</MenuItem>
        <MenuItem onClick={handleMetadata}>View Metadata</MenuItem>
        <MenuItem onClick={handleDownloadImage}>Download Image</MenuItem>
        <MenuItem onClick={handleDownloadRecord}>Download Record</MenuItem>
      </Menu>

      <JsonAttributeViewerDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        record={record}
      />

    <AddTagsFormDialog
      isOpen={openAddTagDialog}
      setIsOpen={setOpenAddTagDialog}
      record={record}
      rows={rows}
      setRows={setRows}
    />

    </div>
  );
}
