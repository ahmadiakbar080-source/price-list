import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

function Svg(props: P) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    />
  );
}

export const ChartIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 15v3M12 9v9M17 5v13" />
  </Svg>
);

export const BoxIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
    <path d="M3.3 8.3 12 13l8.7-4.7M12 13v8" />
  </Svg>
);

export const PaletteIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 21a9 9 0 1 1 9-9c0 2.2-1.6 3.2-3.2 3.2h-1.6a2 2 0 0 0-1.5 3.3c.4.5.3 2.5-2.7 2.5z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7.2" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7.8" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const GearIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
    <circle cx="9" cy="7" r="2" fill="white" />
    <circle cx="15" cy="12" r="2" fill="white" />
    <circle cx="8" cy="17" r="2" fill="white" />
  </Svg>
);

export const EyeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const RocketIcon = (p: P) => (
  <Svg {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

export const LogoutIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const PlusIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const TrashIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l.8 12a2 2 0 0 0 2 1.9h6.4a2 2 0 0 0 2-1.9L18 7" />
  </Svg>
);

export const PencilIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17l-1 4z" />
    <path d="M14.5 5.5l3 3" />
  </Svg>
);

export const GripIcon = (p: P) => (
  <Svg {...p}>
    {[6, 12, 18].map((y) =>
      [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" stroke="none" />),
    )}
  </Svg>
);

export const ChevronUpIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 15l6-6 6 6" />
  </Svg>
);

export const ChevronDownIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const XIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
);

export const CheckCircleIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Svg>
);

export const WarningIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 2.5 20h19L12 3z" />
    <path d="M12 10v4M12 17.5v.1" />
  </Svg>
);

export const InfoCircleIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.1" />
  </Svg>
);

export const ImageIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4 18.5 9.5 13l4 4 3-2.5L20 18" />
  </Svg>
);

export const MenuIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const ClockIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);

export const InboxIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 5h16l2 7v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5l2-7z" />
    <path d="M2 12h6l2 3h4l2-3h6" />
  </Svg>
);

export const RefreshIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-2.9-6.6" />
    <path d="M21 3v6h-6" />
  </Svg>
);

export const LockIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const TypeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 6V4h14v2M12 4v16M9 20h6" />
  </Svg>
);