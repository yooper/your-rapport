import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import * as React from 'react';
import {printPdfReport} from "../../utilities/print_service";
import {useState} from "react";
import JsonAttributeViewerDialog from "../dialogs/JsonAttributeViewerDialog";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {downloadBase64Image, downloadJsonData, findAllMatches, findMatchingValues} from "../../utilities/transformers";
import {getLocalItem} from "../../models/db/local";

export default function SearchTableOptionMenu(props){
  const {record} = props;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const [isOpen, setIsOpen] = useState(false);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePrintPdf = () => {
    printPdfReport('basic', {records: [record]})
    setAnchorEl(null);
  }

  const handleDownloadImage = () => {
    downloadBase64Image(record.screenshot, `${record.uuid}.png`)
    setAnchorEl(null);
  }

  const handleDownloadRecord = () => {
    downloadJsonData(record, `your.rapport.${record.uuid}.json`)
    setAnchorEl(null);
  }

  /**
   * Debug the data
  */
  const handleMetadata = () => {
    setIsOpen(true)
    setAnchorEl(null);
  }

  return (
    <div>
      <MoreVertIcon
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
      </MoreVertIcon>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handlePrintPdf}>Print</MenuItem>
        <MenuItem onClick={handleMetadata}>View Metadata</MenuItem>
        <MenuItem onClick={handleDownloadImage}>Download Image</MenuItem>
        <MenuItem onClick={handleDownloadRecord}>Download Record</MenuItem>
      </Menu>
      <JsonAttributeViewerDialog isOpen={isOpen} setIsOpen={setIsOpen} record={record} />
    </div>
  );
}