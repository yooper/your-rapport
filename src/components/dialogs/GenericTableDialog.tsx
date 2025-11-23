import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
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
import { hideLoader, showLoader, createTab } from '../../utilities/loaders'
import AttachmentIcon from '@mui/icons-material/Attachment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';


type IconName = "HelpOutlineIcon" | "InfoOutlinedIcon" | "VisibilityOutlinedIcon" | "AttachmentIcon";

type RecordType = Record<string, unknown>;

interface GenericTableDialogProps<T extends RecordType = RecordType> {
  url?: string | Promise<string> | null;
  selectedRecord?: Record<string, any>;
  title?: string;
  iconType?: IconName;
  lazyLoad?: boolean;
  defaultHeaders?: string[];
  defaultRecords?: T[];
}

const GenericTableDialog = <T extends RecordType = RecordType>({
  title = "",
  iconType = "VisibilityOutlinedIcon",
  defaultHeaders = [],
  defaultRecords = [],

}: GenericTableDialogProps<T>) => {
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<T[] | null>(null);
  const [color, setColor] = useState<string>("white");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      showLoader();
      setHeaders(defaultHeaders);
      setRecords(defaultRecords ?? []);
      hideLoader()
    };
    fetchData();
  }, []);


  const handleClose = () => setOpen(false);

  const handleClick = async () => {
    setOpen(true);
  };

  const getIconComponent = (): React.ElementType => {
    switch (iconType) {
      case "AttachmentIcon":
        return AttachmentIcon
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
      <Icon onClick={handleClick} />
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
                  {records?.map((record, rowIdx) => (
                    <TableRow key={`row-${rowIdx}`}>
                      {headers.map((h) => (
                        <TableCell key={`cell-${rowIdx}-${h}`}>
                          {h === 'view' ? <OpenInNewIcon
                            onClick={() => {createTab(record[h])}} />
                            : formatCellValue((record as RecordType)[h])}
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

export default GenericTableDialog;

/** Render values safely for the cell */
function formatCellValue(value: unknown): React.ReactNode {
  if (value == null) return "";
  if (typeof value === "object") {
    try {
      return <code style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(value, null, 2)}</code>;
    } catch {
      return String(value);
    }
  }
  return String(value);
}
