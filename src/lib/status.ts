import type { VisualStatus, TrainStatus, ContractStatus, BookingStatus } from "./types";

export interface StatusStyle {
  bg: string;
  border: string;
  fg: string;
  labelKey: string;
  hatched?: boolean;
}

export const VISUAL_STATUS: Record<VisualStatus, StatusStyle> = {
  free: { bg: "#dff5e6", border: "#2f9e5e", fg: "#14532d", labelKey: "trainDetail.legendFree" },
  occupied: { bg: "#e2654f2e", border: "#e2654f", fg: "#7d2a19", labelKey: "trainDetail.legendOccupied" },
  ending: { bg: "#fff0cf", border: "#d99a1b", fg: "#7a5205", labelKey: "trainDetail.legendEnding" },
  closed: { bg: "#eef2f6", border: "#94a3b8", fg: "#475569", labelKey: "trainDetail.legendClosed" },
  prohibited: { bg: "#f1f1f4", border: "#94a3b8", fg: "#52525b", labelKey: "trainDetail.legendProhibited", hatched: true },
};

export const TRAIN_STATUS: Record<TrainStatus, StatusStyle> = {
  new: { bg: "#e6f3ec", border: "#c8e4d5", fg: "#1c6b3f", labelKey: "trains.statusNew" },
  old: { bg: "#eef2f6", border: "#dde4ea", fg: "#4a5a6b", labelKey: "trains.statusOld" },
};

export const CONTRACT_STATUS: Record<ContractStatus, StatusStyle> = {
  draft: { bg: "#eef2f6", border: "#dde4ea", fg: "#4a5a6b", labelKey: "contracts.statusDraft" },
  active: { bg: "#e6f3ec", border: "#c8e4d5", fg: "#1c6b3f", labelKey: "contracts.statusActive" },
  expired: { bg: "#fff0cf", border: "#f0dcae", fg: "#7a5205", labelKey: "contracts.statusExpired" },
  cancelled: { bg: "#ffe3dd", border: "#f0c7be", fg: "#8c2f1d", labelKey: "contracts.statusCancelled" },
};

export const BOOKING_STATUS: Record<BookingStatus, StatusStyle> = {
  planned: { bg: "#eef2f6", border: "#dde4ea", fg: "#4a5a6b", labelKey: "bookingStatus.planned" },
  active: { bg: "#e6f3ec", border: "#c8e4d5", fg: "#1c6b3f", labelKey: "bookingStatus.active" },
  expired: { bg: "#fff0cf", border: "#f0dcae", fg: "#7a5205", labelKey: "bookingStatus.expired" },
  cancelled: { bg: "#ffe3dd", border: "#f0c7be", fg: "#8c2f1d", labelKey: "bookingStatus.cancelled" },
};
