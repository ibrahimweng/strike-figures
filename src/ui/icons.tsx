/* Line icons drawn for the tool, 16px on a 16 grid, in the figures' own isometric angles where they show shapes. */
import type { ReactNode } from 'react';

const Icon = ({ children, size = 16 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export const IconBox = () => (
  <Icon>
    <path d="M8 2 13.5 4.75v6.5L8 14 2.5 11.25v-6.5Z" />
    <path d="M2.5 4.75 8 7.5l5.5-2.75M8 7.5V14" />
  </Icon>
);
export const IconSlab = () => (
  <Icon>
    <path d="M8 4.5 14 7.5v2L8 12.5 2 9.5v-2Z" />
    <path d="M2 7.5 8 10.5l6-3M8 10.5v2" />
  </Icon>
);
export const IconFin = () => (
  <Icon>
    <path d="M3 3.5 12.5 8.25v4.25L11.5 13 2 8.25V4Z" />
    <path d="M2 4 11.5 8.75V13" />
  </Icon>
);
export const IconCylinder = () => (
  <Icon>
    <ellipse cx="8" cy="4.75" rx="5" ry="2.25" />
    <path d="M3 4.75v6.5c0 1.25 2.25 2.25 5 2.25s5-1 5-2.25v-6.5" />
  </Icon>
);
export const IconHex = () => (
  <Icon>
    <path d="M5 3.5h6l3 4.5-3 4.5H5L2 8Z" />
  </Icon>
);
export const IconChevron = () => (
  <Icon>
    <path d="M8 2.5 14 7.5l-2 1.5-4-3.25L4 9 2 7.5Z" />
    <path d="M8 7.5 14 12.5l-2 1.5-4-3.25L4 14l-2-1.5Z" opacity={0.55} />
  </Icon>
);
export const IconUndo = () => (
  <Icon>
    <path d="M5.5 4 2.5 7l3 3" />
    <path d="M2.5 7h7a4 4 0 0 1 0 8H7" />
  </Icon>
);
export const IconRedo = () => (
  <Icon>
    <path d="M10.5 4l3 3-3 3" />
    <path d="M13.5 7h-7a4 4 0 0 0 0 8H9" />
  </Icon>
);
export const IconEye = ({ off }: { off?: boolean }) => (
  <Icon size={14}>
    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" opacity={off ? 0.35 : 1} />
    <circle cx="8" cy="8" r="2" opacity={off ? 0.35 : 1} />
    {off && <path d="M3 13 13 3" />}
  </Icon>
);
export const IconLock = ({ open }: { open?: boolean }) => (
  <Icon size={14}>
    <rect x="3.5" y="7" width="9" height="6.5" />
    <path d={open ? 'M5.5 7V5a2.5 2.5 0 0 1 5 0' : 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2'} />
  </Icon>
);
export const IconCopy = () => (
  <Icon size={14}>
    <rect x="5" y="5" width="8.5" height="8.5" />
    <path d="M10.5 5V2.5H2.5v8H5" />
  </Icon>
);
export const IconTrash = () => (
  <Icon size={14}>
    <path d="M2.5 4.5h11M6 4.5V2.5h4v2M4 4.5l.75 9h6.5l.75-9" />
  </Icon>
);
export const IconPlus = () => (
  <Icon size={14}>
    <path d="M8 3v10M3 8h10" />
  </Icon>
);
export const IconReset = () => (
  <Icon size={14}>
    <path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.8" />
    <path d="M2.5 2.5v2.5H5" />
  </Icon>
);
export const IconDownload = () => (
  <Icon>
    <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
  </Icon>
);
export const IconUpload = () => (
  <Icon size={14}>
    <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M3 13.5h10" />
  </Icon>
);
export const IconFit = () => (
  <Icon size={14}>
    <path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3" />
  </Icon>
);
export const IconChev = () => (
  <Icon size={12}>
    <path d="M4 6l4 4 4-4" />
  </Icon>
);
export const IconRepeat = () => (
  <Icon size={14}>
    <rect x="2" y="2" width="5" height="5" />
    <rect x="9" y="9" width="5" height="5" />
    <path d="M7 4.5h4.5V9" strokeDasharray="1.5 1.5" />
  </Icon>
);

/** The Strike mark: three chevrons, from the logo on strikelabs.app. */
export const StrikeMark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <defs>
      <linearGradient id="sm-g0" x1="4" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#10b981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="sm-g1" x1="4" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="sm-g2" x1="4" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#6ee7b7" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
    {(
      [
        [22, 'sm-g0', ['#047857', '#065f46', '#064e3b', '#065f46']],
        [11, 'sm-g1', ['#059669', '#047857', '#065f46', '#047857']],
        [0, 'sm-g2', ['#10b981', '#059669', '#047857', '#059669']],
      ] as const
    ).map(([dy, g, sides]) => (
      <g key={dy} transform={`translate(0 ${dy})`}>
        <path d="M32 4 L60 26 L51 33 L32 18 L13 33 L4 26 Z" fill={`url(#${g})`} />
        <path d="M4 26 L13 33 L13 38 L4 31 Z" fill={sides[0]} />
        <path d="M13 33 L32 18 L32 23 L13 38 Z" fill={sides[1]} />
        <path d="M32 18 L51 33 L51 38 L32 23 Z" fill={sides[2]} />
        <path d="M51 33 L60 26 L60 31 L51 38 Z" fill={sides[3]} />
      </g>
    ))}
  </svg>
);
