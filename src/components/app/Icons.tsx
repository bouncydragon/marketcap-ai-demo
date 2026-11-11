import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

type P = SVGProps<SVGSVGElement>;
export const IconGrid = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>);
export const IconList = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="4" width="6" height="6" rx="1.6" /><rect x="3.5" y="14" width="6" height="6" rx="1.6" /><path d="M13.5 7h7M13.5 17h7M13.5 10.5h4" /></svg>);
export const IconMarkets = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><path d="m7.5 15 3-3.2 2.5 2.2 3.5-4.5" /></svg>);
export const IconInbox = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="3.5" /><path d="M3.5 13.5h4.8l1.2 2h5l1.2-2h4.8" /></svg>);
export const IconSettings = (p: P) => (<svg {...base} {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>);
export const IconHelp = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.6M12 16.8h.01" /></svg>);
export const IconSearch = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>);
export const IconBell = (p: P) => (<svg {...base} {...p}><path d="M6 17.5V11a6 6 0 0 1 12 0v6.5l1.5 1.5h-15Z" /><path d="M10 21.5a2.2 2.2 0 0 0 4 0" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>);
export const IconUpload = (p: P) => (<svg {...base} {...p}><path d="M7 17.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8" /><path d="M12 20v-8M9 14.5l3-3 3 3" /></svg>);
export const IconDollar = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.2c-.4-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 1.8 0 2.5 5 1.2 5 3.7 0 1.1-1.1 1.9-2.5 1.9-1.2 0-2.2-.5-2.6-1.4M12 6.5v1.5M12 16v1.5" /></svg>);
export const IconTrend = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><path d="m7.5 14.5 3-3 2.5 2 3.5-4.5" /></svg>);
export const IconDots = (p: P) => (<svg {...base} {...p} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>);
export const IconChevronDown = (p: P) => (<svg {...base} width={16} height={16} {...p}><path d="m6 9 6 6 6-6" /></svg>);
export const IconSidebar = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="4" width="17" height="16" rx="3.5" /><path d="M10 4v16" /></svg>);
export const IconLogout = (p: P) => (<svg {...base} {...p}><path d="M14 4.5H7a2.5 2.5 0 0 0-2.5 2.5v10A2.5 2.5 0 0 0 7 19.5h7M10.5 12h9M16.5 8.5 20 12l-3.5 3.5" /></svg>);
export const IconLine = (p: P) => (<svg {...base} {...p}><path d="m3.5 16 5-5 3.5 3 8-8.5" /></svg>);
export const IconCandle = (p: P) => (<svg {...base} {...p}><path d="M8 4v3M8 17v3M16 3v4M16 15v5" /><rect x="5.5" y="7" width="5" height="10" rx="1.2" /><rect x="13.5" y="7" width="5" height="8" rx="1.2" /></svg>);
export const IconBars = (p: P) => (<svg {...base} {...p}><path d="M5 20v-6M12 20V6M19 20v-9" /></svg>);
export const IconInfo = (p: P) => (<svg {...base} width={14} height={14} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>);

export const IconHome = (p: P) => (<svg {...base} {...p}><path d="M4 11 12 4l8 7v8a1.5 1.5 0 0 1-1.5 1.5h-3V15h-7v5.5h-3A1.5 1.5 0 0 1 4 19v-8Z" /></svg>);
export const IconWallet = (p: P) => (<svg {...base} {...p}><path d="M19.5 8.5V7A2.5 2.5 0 0 0 17 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H17a2.5 2.5 0 0 0 2.5-2.5v-1.5" /><path d="M21 10.5h-4.5a2 2 0 0 0 0 4H21Z" /></svg>);
export const IconPie = (p: P) => (<svg {...base} {...p}><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12Z" /><path d="M14.5 3.8A8.5 8.5 0 0 1 20.2 9.5h-5.7Z" /></svg>);
export const IconChartBars = (p: P) => (<svg {...base} {...p}><path d="M4 4v16h16" /><path d="M8.5 16v-3M12.5 16V9.5M16.5 16v-5" /></svg>);
export const IconSparkle = (p: P) => (<svg {...base} {...p}><path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9 12 3.5Z" /><path d="M19 3v3M17.5 4.5h3" /></svg>);
export const IconSun = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>);
export const IconMoon = (p: P) => (<svg {...base} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>);
export const IconArrowUp = (p: P) => (<svg {...base} width={14} height={14} strokeWidth={2} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>);
export const IconArrowDown = (p: P) => (<svg {...base} width={14} height={14} strokeWidth={2} {...p}><path d="M12 5v14M6 13l6 6 6-6" /></svg>);
export const IconArrowRight = (p: P) => (<svg {...base} width={15} height={15} strokeWidth={2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
