import React, { Fragment, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { withStyles } from 'tss-react/mui';
import Tooltip from '@mui/material/Tooltip';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import {
  downloadBase64Image,
  downloadJsonData,
} from '../../../utilities/transformers';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import { mergeImagesVertically } from '../../../services/image_loading_services';
import { hideLoader, showLoader } from '../../../utilities/loaders';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { db } from '../../../models/db/dexieDb';
import { Artifact } from '../../../models/schemas/Artifact';
import TagIcon from '@mui/icons-material/Tag';
import AddTagsMultiplFormDialog from '../../dialogs/search_dashboard/AddTagsMultipleFormDialog';


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
  const { classes, selectedRows, displayData, columns, rows, refreshRows } = props;
  const [openAddTagDialog, setOpenAddTagDialog] = useState(false);
  const [rapports, setRapports] = useState([])

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
        <Tooltip title={'Add multiple tags to the selected records.'}>
          <span>
            <IconButton>
              <TagIcon onClick={() => {
                const orderedIndex = selectedRows.data.map(
                  (sr) => sr.dataIndex
                );
                const orderedRapports = [];
                for (let idx of orderedIndex) {
                  orderedRapports.push(rows[idx]);
                }
                setRapports(orderedRapports)
                setOpenAddTagDialog(true)
              }}
              />
            </IconButton>
            <AddTagsMultiplFormDialog
              isOpen={openAddTagDialog}
              setIsOpen={setOpenAddTagDialog}
              rapports={rapports}
              refreshRows={refreshRows}
            />
          </span>
        </Tooltip>
        <Tooltip title={'Merge multiple screenshots and download the image.'}>
          <span>
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
          </span>
        </Tooltip>
        <Tooltip title={'Delete'}>
          <span>
            <IconButton>
              <DeleteIcon
                onClick={() => {
                  props.onRowsDelete(selectedRows, displayData);
                }}
              />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title={'Export selected rapports into a formatted file that can easily be ingested into AI for summarization'}
        >
          <IconButton>
            <TextSnippetIcon
              onClick={async () => {
                const rapports = await getRapportRecords(
                  selectedRows,
                  displayData,
                  columns
                );
                rapports.forEach(r => r.artifacts = []);
                // used to make it easier to export records to AI tools for summarizing
                downloadJsonData(rapports.map(r => {
                  return {
                    text: r.text,
                    url: r.url,
                    domain: r.domain,
                    selectors: r.selectors,
                    tags: r.tags
                  }
                }), 'your-rapport-ai.json');
              }}
            />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={'Export Selected Rapports in a JSON file to share or backup, excludes artifacts unless signed in.'}
        >
          <IconButton>
            <CloudDownloadIcon
              onClick={async () => {
                const rapports = await getRapportRecords(
                  selectedRows,
                  displayData,
                  columns
                );
                // TODO: support exporting artifacts.
                rapports.forEach(r => r.artifacts = []);
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

  const rapports = (await db.rapport.toArray() ?? []).filter((r) =>
    uuids.includes(r.uuid)
  );

  // TODO: Filter
  for(const rapport of rapports){
    rapport.artifacts = []; // initialize empty artifacts
    // TODO: Skip processing if not authenticated
    const artifacts = await db.artifact.where('rapportUuid').equals(rapport.uuid).toArray();
    for(const artifact of artifacts)
    {
      rapport.artifacts.push(await Artifact.serialize(artifact));
    }
  }
  return rapports;
}

export default withStyles(
  SearchDataTableToolbarSelect,
  defaultToolbarSelectStyles,
  { name: 'SearchDataTableToolbarSelect' }
);
