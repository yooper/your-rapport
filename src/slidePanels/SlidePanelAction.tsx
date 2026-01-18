import * as React from "react";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from '@mui/icons-material/Refresh';
import QueueIcon from '@mui/icons-material/Queue';
import { IExtractedData } from '../types';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { BULK_AUTOMATION, UUID } from '../services/constants';
import { addRecord} from '../models/db/local';
import { createTab, processNotification } from '../utilities/loaders';
import Stack from "@mui/material/Stack";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { db } from '../models/db/dexieDb';


type SlidePanelActionProps = {
  icon: any;
  toolTip: string;
  pluginType?: string;
  onClick?: any;
  disabled?: boolean;
  data: IExtractedData|null;
};


export const SlidePanelAction: React.FC<SlidePanelActionProps> = ({
  icon,
  toolTip,
  pluginType, // kept for future use
  onClick,
  data,
  disabled = false,
}) => {
  return (
    <Tooltip title={toolTip}>
        <IconButton onClick={() => onClick(data)} disabled={disabled} size="small">
          {icon}
        </IconButton>
    </Tooltip>
  );
};


export const urlActions: SlidePanelActionProps[] = [
  {
    icon: <QueueIcon />,
    toolTip: 'test url',
    pluginType: 'url', // kept for future use
    onClick: (data: IExtractedData) => {
      const record = BulkAutomationUrl.createBulkAutomationJob(data.value);

      db.bulkAutomation.add(record).then(() => {
        processNotification({title:'Queued', message:'Url has been queued. Visit the automations page to start the automation run.', type:'info'});
      })
    },
    disabled:false,
    data: null
  },
  {
    icon: <OpenInNewIcon />,
    toolTip: 'Open web page in new tab.',
    pluginType: 'url',
    onClick: (data: IExtractedData) => {
      createTab(data.value);
    },
    disabled:false,
    data: null
  }
]

export function UrlActionButtons({ data }: { data: IExtractedData }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {urlActions
        .filter((a) => !a.pluginType || a.pluginType === 'url')
        .map((action, idx) => (
          <SlidePanelAction
            key={`${action.toolTip}-${idx}`}
            {...action}
            data={data}
          />
        ))}
    </Stack>
  );
}

