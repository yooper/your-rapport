import React, { Fragment } from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { withStyles } from 'tss-react/mui';
import Tooltip from '@mui/material/Tooltip';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import {
  downloadBase64Image,
  downloadJsonData,
} from '../../../utilities/transformers';
import { RAPPORT } from '../../../services/constants';
import { getLocalItem } from '../../../models/db/local';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import { mergeImagesVertically } from '../../../services/image_loading_services';
import { hideLoader, showLoader } from '../../../utilities/loaders';

const defaultToolbarSelectStyles = (theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    flex: '1 1 100%',
    display: 'flex',
    position: 'relative',
    zIndex: 120,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop:
      typeof theme.spacing === 'function'
        ? theme.spacing(1)
        : theme.spacing.unit,
    paddingBottom:
      typeof theme.spacing === 'function'
        ? theme.spacing(1)
        : theme.spacing.unit,
    '@media print': {
      display: 'none',
    },
  },
  title: {
    paddingLeft: '26px',
  },
  iconButton: {
    marginRight: '24px',
  },
  deleteIcon: {},
});

function SearchDataTableToolbarSelect(props) {
  const { classes, selectedRows, displayData, columns, rows } = props;
  /**
   * @param {number[]} selectedRows Array of rows indexes that are selected, e.g. [0, 2] will select first and third rows in table
   */
  function handleCustomSelectedRows(selectedRows) {
    if (!Array.isArray(selectedRows)) {
      throw new TypeError(
        `"selectedRows" must be an "array", but it's "${typeof selectedRows}"`
      );
    }

    if (selectedRows.some((row) => typeof row !== 'number')) {
      throw new TypeError(`Array "selectedRows" must contain only numbers`);
    }

    const { options } = props;
    if (selectedRows.length > 1 && options.selectableRows === 'single') {
      throw new Error(
        'Can not select more than one row when "selectableRows" is "single"'
      );
    }
    props.selectRowUpdate('custom', selectedRows);
  }

  return (
    <Fragment>
      <span style={{ justifyContent: 'right' }}>
        <Tooltip title={'Merge multiple screenshots and download the image.'}>
          <IconButton>
            <BurstModeIcon
              onClick={async () => {
                showLoader();
                const orderedIndex = selectedRows.data.map(
                  (sr) => sr.dataIndex
                );
                const orderedRapports = [];
                for (let idx of orderedIndex) {
                  orderedRapports.push(rows[idx]);
                }
                const dataUri = await mergeImagesVertically(orderedRapports);
                await downloadBase64Image(
                  dataUri,
                  'your_rapport_merged_images.png'
                );
                hideLoader();
              }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Delete'}>
          <IconButton>
            <DeleteIcon
              onClick={() => {
                props.onRowsDelete(selectedRows, displayData);
              }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={'Export Selected Rapports in a JSON file to share or backup.'}
        >
          <IconButton>
            <CloudDownloadIcon
              onClick={async () => {
                const rapports = getRapportRecords(
                  selectedRows,
                  displayData,
                  columns
                );
                downloadJsonData(rapports, 'your-rapports.json');
              }}
            />
          </IconButton>
        </Tooltip>
      </span>
    </Fragment>
  );
}

async function getRapportRecords(selectedRows, displayData, columns) {
  const indices = Object.keys(selectedRows.lookup);
  const rows = displayData.filter((d) => indices.includes('' + d.dataIndex));
  let uuids = [];
  for (let i = 0; i < rows.length; i++) {
    let record = {};
    for (let idx = 0; idx < columns.length; idx++) {
      record[columns[idx].name] = rows[i].data[idx];
    }
    uuids.push(record.uuid);
  }
  const rapports = ((await getLocalItem(RAPPORT)) ?? []).filter((r) =>
    uuids.includes(r.uuid)
  );
  return rapports;
}

export default withStyles(
  SearchDataTableToolbarSelect,
  defaultToolbarSelectStyles,
  { name: 'SearchDataTableToolbarSelect' }
);
