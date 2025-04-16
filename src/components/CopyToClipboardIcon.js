import React from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {processNotification} from "../utilities/loaders";

const CopyToClipboardIcon = (props) => {

    const handleClick = async() => {
      await navigator.clipboard.writeText(props.record[props.copyFieldName])
      processNotification({
          Title: 'Copy to Clipboard',
          Message: `The value '${props.record[props.copyFieldName]}' to your clipboard`,
          Type: 'success'
      })
    }

    return (
        <>
          <ContentCopyIcon  onClick={ handleClick } />
        </>
    )
}

export default CopyToClipboardIcon