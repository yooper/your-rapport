import { Box, Paper, TextareaAutosize } from '@mui/material';
import React from 'react';
import { DiscoveryPluginBasicFormProps } from '../../../types';

const DescriptionForm: React.FC<DiscoveryPluginBasicFormProps> = ({
  record,
  setRecord
}) => {
  return (
    <TextareaAutosize
      style={{ width: 800 }}
      minRows={25}
      maxRows={100}
      placeholder="Enter an optional description for the discovery plugin"
      name="description"
      id="description"
      defaultValue={record.description}
      onChange={(e) =>
        setRecord((prev) => ({ ...prev, description: e.target.value }))
      }
    />
  );
};
export default DescriptionForm