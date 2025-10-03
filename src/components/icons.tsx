import * as React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function MHTMLIconOutlined(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Outlined square */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* "MHTML" text inside */}
      <text
        x="50%"
        y="15"
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
