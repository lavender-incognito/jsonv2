export type JsonVersion = 0 | 5;
export type Merge = "memory" | "file" | "both";
export type SetApiOptions = { write?: boolean };
export type HasApiOptions = { merge?: Merge };
export type DeleteApiOptions = { write?: boolean };
export type ReloadApiOptions = { writePending: boolean };
