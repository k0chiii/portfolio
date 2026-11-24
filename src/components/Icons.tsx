const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SunIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1.2M8 12.8V14M2 8h1.2M12.8 8H14M3.76 3.76l.85.85M11.39 11.39l.85.85M12.24 3.76l-.85.85M4.61 11.39l-.85.85" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M13 9.7A5.3 5.3 0 0 1 6.3 3a5.5 5.5 0 1 0 6.7 6.7Z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5.5 3.5v9M10.5 3.5v9" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5 3.5 12 8l-7 4.5v-9Z" />
    </svg>
  );
}

export function ArrowUpRightIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
