import React from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { processNotification } from '../utilities/loaders';

const CopyToClipboardIcon = (props) => {
  const handleClick = async () => {
    await navigator.clipboard.writeText(props.record[props.copyFieldName]);
    processNotification({
      title: 'Copy to Clipboard',
      message: `The value '${
        props.record[props.copyFieldName]
      }' to your clipboard`,
      type: 'success',
    });
  };

  return (
    <>
      <ContentCopyIcon onClick={handleClick} color={props.color}/>
    </>
  );
};

export default CopyToClipboardIcon;
