import React from 'react';
import ShareIcon from '@mui/icons-material/Share';
import { base64ToFile } from '../utilities/transformers';

/**
 * Doesn't work due to Chrome Extension security policy
 * TODO: Find method to share records easily
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export function ShareFile(props) {
  const { record } = props;
  const handleClick = async () => {
    if (navigator.share) {
      const file = base64ToFile(record.screenshot);
      navigator.share({ files: [file], title: 'Share File' });
    }
  };
  return (
    <>
      <ShareIcon onClick={handleClick} />
    </>
  );
}
