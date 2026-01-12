import * as React from "react";
import Box from "@mui/material/Box";
import { useEffect, useMemo, useState } from "react";
import MUIDataTable, {
  MUIDataTableColumn,
  MUIDataTableOptions,
  MUIDataTableIsRowCheck,
} from 'mui-datatables';
import {
  deleteRecord,
  getLocalItem,
  setLocalItem,
  updateRecord,
} from "../../models/db/local";
import {
  hideLoader,
  processNotification,
  showLoader,
} from "../../utilities/loaders";
import IconButton from "@mui/material/IconButton";
import { FormControlLabel, Switch, Tooltip } from "@mui/material";
import HelperPopover from "../HelperPopover";
import { BULK_AUTOMATION, UUID } from "../../services/constants";
import { debug } from "../../services/logger_services";
import { db } from '../../models/db/dexieDb';
import AlarmAddIcon from '@mui/icons-material/AlarmAdd';
import { ScheduledAutomation } from '../../models/schemas/ScheduledAutomation';
import ScheduleAutomationDialog from '../dialogs/automations/ScheduledAutomationDialog';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BulkAutomationUrl from '../../models/schemas/BulkAutomationUrl';
import EditIcon from '@mui/icons-material/Edit';
import { CronExpressionParser } from 'cron-parser';
import { getUtcNow } from '../../utilities/transformers';


export default function ScheduledAutomationDataTable(): JSX.Element {
  const [rows, setRows] = useState<ScheduledAutomation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const refresh = async (): Promise<void> => {
    showLoader();
    setIsLoading(true);

    const start = performance.now();
    const records = await db.scheduledAutomation.toArray();

    if (records.length !== rows.length){
      setRows(records);
    }

    const elapsed = performance.now() - start;
    debug(`Finished after ${elapsed.toFixed(0)}ms`);
    setIsLoading(false);
    hideLoader();
  };

  useEffect(() => {
    void refresh();

    const intervalId = window.setInterval(async () => {
      // void refresh(); // enable if you want periodic refresh
    }, 3000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRecord = (rowData: any) => {
    let record: any = {};
    for (let idx = 0; idx < columns.length; idx++) {
      record[columns[idx].name] = rowData[idx];
    }
    return record;
  };

  const columns: MUIDataTableColumn[] = [
      {
        name: UUID,
        label: "UUID",
        options: { display: "excluded", filter: false, sort: false },
      },
      {
        label: "ACTIVE",
        name: "active",
        options: {
          display: true,
          filter: true,
          sort: true,
          customBodyRender: (
            value: any,
            tableMeta: any,
            updateValue: any
          ) => {
            const record = getRecord(tableMeta.rowData);

            return (
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={value}
                    onChange={async (_e, nextChecked) => {
                      updateValue(nextChecked);
                      record.active = nextChecked;
                      // TODO: update rapport
                      await updateRecord(BULK_AUTOMATION, UUID, record);
                    }}
                  />
                }
                label={
                  <IconButton>
                    <HelperPopover message="Enable/disable this scheduled automation." />
                  </IconButton>
                }
              />
            );
          },
        },
      },
      {
        name: "crontab",
        label: "CRONTAB",
        options: {
          filter: true,
          sort: false,
          searchable: true,
          customBodyRender: (value: unknown) => {
            const v = typeof value === "string" ? value : "";
            return <div>{v}</div>;
          },
        },
      },
      {
        name: "url",
        label: "URL",
        options: {
          filter: false,
          sort: false,
          customBodyRenderLite: (dataIndex: number) => (
            <>
              {rows[dataIndex].url}
            </>
          ),
        },
      },
      {
        label: "DEEP SAVE",
        name: "isDeepSave",
        options: {
          display: true,
          filter: false,
          sort: false,
          customBodyRender: (
            value: any,
            tableMeta: any,
            updateValue: any
          ) => {
            const record = getRecord(tableMeta.rowData);

            return (
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={value}
                    onChange={async (_e, nextChecked) => {
                      updateValue(nextChecked);
                      record.isDeepSave = nextChecked;
                      // TODO: update record
                    }}
                  />
                }
                label={
                  <IconButton>
                    <HelperPopover message="Deep Save collects multiple artifacts (beyond basic screenshots)." />
                  </IconButton>
                }
              />
            );
          },
        },
      },
      {
        label: "KEEP TAB OPEN",
        name: "keepTabOpen",
        options: {
          display: true,
          filter: false,
          sort: false,
          customBodyRender: (
            value: any,
            tableMeta: any,
            updateValue: any
          ) => {
            const record = getRecord(tableMeta.rowData);

            return (
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={value}
                    onChange={async (_e, nextChecked) => {
                      updateValue(nextChecked);
                      record.keepTabOpen = nextChecked;
                      await db.scheduledAutomation.put(record);
                    }}
                  />
                }
                label={
                  <IconButton>
                    <HelperPopover message="After the collection process has completed, do you want the tab to stay open?" />
                  </IconButton>
                }
              />
            );
          },
        },
      },
      {
        name: "lastRanOn",
        label: "LAST RAN",
        options: {
          filter: false,
          sort: true,
          searchable: false,
          customBodyRender: (value: any) => {
            return <div>

            </div>;
          },
        },
      },
      {
        label: "OPTIONS",
        name: "options",
        options: {
          display: true,
          filter: false,
          sort: false,
          customBodyRender: (_value: any, tableMeta: any) => {
            const record: ScheduledAutomation = getRecord(tableMeta.rowData);
            return (
              <>
              <Tooltip title={'Edit Automation'}>
                <IconButton
                  onClick={async () => {}}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={'Test Automation'}>
                <IconButton
                  onClick={async () => {
                    try {
                      const interval = CronExpressionParser.parse(record.crontab);
                      const now = new Date()
                      now.setUTCSeconds(0, 0);

                      if(interval.includesDate(now)){
                        console.log('now '+ now.toISOString());
                      }
                      console.log('Prev:', interval.prev().toString());
                      // Get next 3 dates
                      console.log(
                        'Next 3:',
                        interval.take(3).map((date) => date.toString()),
                      );
                      // Get previous date
                      console.log('Previous:', interval.prev().toString());
                    } catch (err) {
                      console.log('Error:', err.message);
                    }

                  }}
                >
                  <DirectionsRunIcon />
                </IconButton>
              </Tooltip>
              </>

            );
          },
        },
      },
    ];
      // eslint-disable-next-line react-hooks/exhaustive-deps
    const options: MUIDataTableOptions = {
        rowsPerPage: 50,
        rowsPerPageOptions: [20, 50],
        searchAlwaysOpen: true,
        onRowsDelete: async (deleteInfo: any) => {
          setIsLoading(true);
          showLoader();

          setIsLoading(false);
          hideLoader();
        },
        customToolbar: () => (
          <>
            <Tooltip title={'Add a new scheduled automation'}>
              <IconButton onClick={() => { setIsOpen(true)}}>
                <AlarmAddIcon />
              </IconButton>
            </Tooltip>
            <ScheduleAutomationDialog
             onClose={() => setIsOpen(false)}
             onSave={async(record:ScheduledAutomation) => {
               try{
                 await db.scheduledAutomation.add(record);
                 processNotification({
                   title:'Scheduled Automation Added',
                   message:`A scheduled automation was added for the url ${record.url}`,
                   type: 'success'
                 })
               }
               catch(e){
                 debug(`scheduled automation did not save + ${String(e)}`, record);
                 processNotification({
                   title:'Scheduled Automation Not Added',
                   message:`The scheduled automation could not be added.`,
                   type: 'danger'
                 })
               }
               finally {
                 refresh()
                 setIsOpen(false)
               }
             }}
             open={isOpen}
             title={'Add a scheduled automation'}
             initialValues={{...new ScheduledAutomation()}}
             refresh={refresh}
            />
          </>
        ),
        setTableProps: () => ({ size: "small" as const }),
        print: false,
        filter: false,
        download: false,
    };

  if (isLoading){
    return <div />;
  }

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <MUIDataTable
        title={"Scheduled Automation Management"}
        data={rows}
        columns={columns as any}
        options={options as any}
      />
    </Box>
  );
}
