import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachmentIcon from "@mui/icons-material/Attachment";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { createTab, hideLoader, showLoader } from '../../utilities/loaders';
import { CloudDownload } from '@mui/icons-material';
import { downloadJsonData } from '../../utilities/transformers';

type IconName =
  | "HelpOutlineIcon"
  | "InfoOutlinedIcon"
  | "VisibilityOutlinedIcon"
  | "AttachmentIcon";

type RecordType = Record<string, unknown>;

interface GenericTableDialogProps<T extends RecordType = RecordType> {
  url?: string | Promise<string> | null;
  selectedRecord?: Record<string, any>;
  title?: string;
  iconType?: IconName;
  lazyLoad?: boolean;
  defaultHeaders?: string[];
  defaultRecords?: T[];
  onViewRow?: (record: T) => void; // optional hook
}

const GenericTableDialog = <T extends RecordType = RecordType>({
  title = "",
  iconType = "VisibilityOutlinedIcon",
  defaultHeaders = [],
  defaultRecords = [],
  onViewRow,
}: GenericTableDialogProps<T>) => {
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<T[]>([]);
  // const [color, setColor] = useState<string>("white"); // unused

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      showLoader();
      try {
        setHeaders(defaultHeaders);
        setRecords(defaultRecords ?? []);
      } finally {
        hideLoader();
      }
    };
    fetchData();
  }, [defaultHeaders, defaultRecords]);

  const handleClose = () => setOpen(false);
  const handleClick = () => setOpen(true);

  const getIconComponent = (): React.ElementType => {
    switch (iconType) {
      case "AttachmentIcon":
        return AttachmentIcon;
      case "HelpOutlineIcon":
        return HelpOutlineIcon;
      case "InfoOutlinedIcon":
        return InfoOutlinedIcon;
      case "VisibilityOutlinedIcon":
      default:
        return VisibilityOutlinedIcon;
    }
  };

  const Icon = getIconComponent();

  return (
    <>
      <Icon onClick={handleClick} style={{ cursor: "pointer" }} />
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="generic-table-dialog"
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle id="generic-table-dialog">{title}</DialogTitle>

        <DialogContent>
          <Paper>
            <TableContainer sx={{ maxHeight: 400 }} component={Paper}>
              <Table stickyHeader aria-label="sticky table" size="small">
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableCell key={`header-${header}`}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.map((record, rowIdx) => (
                    <TableRow key={`row-${rowIdx}`}>
                      {headers.map((h) => (
                        <TableCell key={`cell-${rowIdx}-${h}`}>
                          <RenderActions
                            header={h}
                            record={record}
                            onView={() => onViewRow?.(record)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained">
            Okay
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

function RenderActions<T extends RecordType>(props: {
  header: string;
  record: T;
  onView?: () => void;
}): React.ReactNode {
  const { header, record, onView } = props;

  if (header === "view") {
    return (
      <Tooltip title="View the record">
        <IconButton size="small" onClick={onView}>
          <OpenInNewIcon fontSize="small" onClick={() => createTab(record[header])} />
        </IconButton>
      </Tooltip>
    );
  }
  else if(header === 'download') {
    return (
      <Tooltip title="Download the data to a file">
        <IconButton size="small" onClick={onView}>
          <CloudDownload fontSize="small" onClick={() => {
            alert('TODO://')
          }}
          />
        </IconButton>
      </Tooltip>
    );
  }
  return formatCellValue((record as any)[header]);
}

/** Render values safely for the cell */
function formatCellValue(value: unknown): React.ReactNode {
  if (value == null) return "";

  if (typeof value === "object") {
    try {
      return (
        <code style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(value, null, 2)}
        </code>
      );
    } catch {
      return String(value);
    }
  }

  return String(value);
}

export default GenericTableDialog;
