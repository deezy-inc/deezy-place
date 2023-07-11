export const MAX_LIMIT_ONSALE = 15;
export const MAX_FETCH_LIMIT = 200;
export const MAX_ONSALE = 15;
export const MIN_ONSALE = 5;
export const ONSALE_BATCH_SIZE = 5;
// Later we can sort by priority
export const OUTXO_PRIOTITY = {
  "image/png": 0,
  "image/jpeg": 1,
  "image/webp": 2,
  "image/gif": 3,
  "video/webm": 4,
  "text/plain": 100,
  "application/json": 200,
  "text/html": 300,
};
export const DEFAULT_UTXO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/webm",
  "text/plain;charset=utf-8",
  "application/json",
  "text/html;charset=utf-8",
];

export const HIDE_TEXT_UTXO_OPTION = "hide .txt";
export const OTHER_UTXO_OPTION = "other";

export const DEFAULT_UTXO_OPTIONS = [
  HIDE_TEXT_UTXO_OPTION,
  ...DEFAULT_UTXO_TYPES,
  OTHER_UTXO_OPTION,
];
