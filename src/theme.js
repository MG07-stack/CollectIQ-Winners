export const INK = "#12172B";
export const CANVAS = "#F6F5F2";
export const PANEL = "#FFFFFF";
export const PRIMARY = "#2F6F5E";
export const PRIMARY_SOFT = "#E4EEEA";
export const HIGH = "#B23A2F";
export const HIGH_SOFT = "#F6E4E1";
export const MED = "#C0872E";
export const MED_SOFT = "#F5EBDB";
export const LOW = "#5B7A6C";
export const LOW_SOFT = "#E7EEEA";
export const TEXT = "#1B1F2A";
export const SUBTLE = "#6B7280";
export const BORDER = "#E7E5E0";

export const MONO = "'IBM Plex Mono', monospace";
export const SERIF = "'Fraunces', serif";

export const priorityColors = {
  High: { fg: HIGH, bg: HIGH_SOFT },
  Medium: { fg: MED, bg: MED_SOFT },
  Low: { fg: LOW, bg: LOW_SOFT },
};

export const statusColors = {
  Paid: { fg: PRIMARY, bg: PRIMARY_SOFT },
  Outstanding: { fg: "#4B5563", bg: "#F0F0EE" },
  Overdue: { fg: HIGH, bg: HIGH_SOFT },
  "Partially Paid": { fg: MED, bg: MED_SOFT },
};

export const money = (n) =>
  "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
