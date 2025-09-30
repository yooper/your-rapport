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
import { Tooltip } from '@mui/material';
import { Artifact } from '../../models/schemas/Artifact';

export default function SearchTableOptionMenu(props) {
  const {record, rows, setRows} = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [hasMhtmlArtifact, setHasMhtmlArtifact] = useState(props.record.artifacts?.length > 0)
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
   * TODO: Support more than mhtml downloads
   */
  const handleDownloadMhtml = () => {
    Artifact.downloadArtifact(record.artifacts[0], `your.rapport.${record.artifacts[0]}.mhtml`);
    handleClose(null);
  }

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
        <Tooltip title={'Add tags to annotate your data and make it easier to find'}>
          <MenuItem onClick={async() => { setOpenAddTagDialog(true); handleClose(); }}>Modify Tag(s)</MenuItem>
        </Tooltip>
        <Tooltip title={'A simple pdf with the screenshot and some metadata'}>
          <MenuItem onClick={handlePrintPdf}>Print</MenuItem>
        </Tooltip>
        <Tooltip title={'View metadata about the capture'}>
          <MenuItem onClick={handleMetadata}>View Metadata</MenuItem>
        </Tooltip>
        <Tooltip title={'Download the screenshot of the web page'}>
          <MenuItem onClick={handleDownloadImage}>Download Image</MenuItem>
        </Tooltip>
        <Tooltip title={'Download a JSON formatted file that can be readily shared.'}>
          <MenuItem onClick={handleDownloadRecord}>Download Record</MenuItem>
        </Tooltip>
        { hasMhtmlArtifact ? 
           <Tooltip title="Download an MHTML file of the web page">
             <MenuItem onClick={handleDownloadMhtml}>Download MHtml</MenuItem>
           </Tooltip>
             : ''}
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
