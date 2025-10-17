import { TextareaAutosize } from '@mui/material';
import React from 'react';
import { DiscoveryPluginBasicFormProps } from '../../../types';

const DescriptionForm: React.FC<DiscoveryPluginBasicFormProps> = ({
  record,
  setRecord,
  pluginTypes,
}) => {
  return (
    <TextareaAutosize
      style={{ width: '90%' }}
      minRows={25}
      maxRows={100}
      placeholder="Enter your urls to bulk scan, one url per line..."
      name="description"
      id="urls"
      defaultValue={record.description}
      onChange={(e) =>
        setRecord((prev) => ({ ...prev, description: e.target.value }))
      }
    />
  );
};
