//shared
export type OpenOptions = { createOnMissing?: boolean };
export type DataStruct = Record<string, any>;
export type CacheMap = Map<string, { isWritten: boolean; value: any }>;
export type Merge = "written" | "unwritten";
export type Line = { key: string; value: any };
export type DataOtpions = { writtenOnly: boolean };
export type ConflitActions = "update" | "skip";

//Json
export type JsonFile = `${string}.json`;
export type SetOptions = { write?: boolean };
export type HasOptions = { wrinttenOnlyMerge: boolean };
export type DeleteOptions = { write?: boolean };
export type SetManyOptions = { write?: boolean; onConflit: ConflitActions };

//Json5
export type Json5File = `${string}.json5`;
export type SetOptions5 = { write?: boolean };
export type HasOptions5 = { wrinttenOnlyMerge: boolean };
export type DeleteOptions5 = { write?: boolean };
export type SetManyOptions5 = { write?: boolean; onConflit: ConflitActions };

