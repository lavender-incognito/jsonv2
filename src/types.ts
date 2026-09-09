export type Separators = "/" | ".";
export type OpenOptions = {
  createOnMissing?: boolean;
  separator: Separators;
  LRU_CACHE?: boolean;
};
