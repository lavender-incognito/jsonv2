export type Separators = "/" | ".";
export type OpenOptions = {
  createOnMissing?: boolean;
  separator: Separators;
  LRU_CACHE?: boolean;
};

export type Line = {
  key: string;
  value: any;
};

export type SetManyOptions = {
  save?: boolean;
  onConflit: "update" | "skip";
};

export type JsonFile =  `${string}.json`