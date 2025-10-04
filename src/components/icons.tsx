import * as React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function MHTMLIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Outline of a document/file with a dog-eared corner */}
      <path
        d="M6 2a2 2 0 0 0-2 2v16a2
           2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 2v6h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* The "MHTML" label inside the file */}
      <text
        x="50%"
        y="18"
        textAnchor="middle"
        fontSize="6"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        MHTML
      </text>
    </SvgIcon>
  );
}
