import JSON5 from "json5";
import fs from "fs";
import type {
  CacheMap,
  DataOtpions,
  DataStruct,
  DeleteOptions5,
  HasOptions5,
  Json5File,
  Line,
  Merge,
  OpenOptions,
  SetManyOptions5,
  SetOptions5,
} from "./types";

//todo types precisions
class Json5 {
  private _cache: CacheMap = new Map();
  private filepath: string;

  constructor(filepath: string) {
    this.filepath = filepath;
    this.load();
  }

  //open json5 file
  static open(filepath: Json5File, options: OpenOptions): Json5 {
    if (!filepath.endsWith(".json5")) {
      throw new Error("Filepath must end with .json5");
    }

    if (!fs.existsSync(filepath)) {
      if (!options.createOnMissing) {
        throw new Error(`Json5 file: ${filepath} doesn't exist`);
      }

      fs.writeFileSync(filepath, JSON5.stringify({}, null, 0)!);
    }
    return new Json5(filepath);
  }

  //load content
  private load(): void {
    const content = JSON5.parse(
      fs.readFileSync(this.filepath, "utf-8"),
    ) as DataStruct;

    for (const [key, value] of Object.entries(content)) {
      this._cache.set(key, { isWritten: true, value });
    }
  }

  //atomic writes
  private atomicWrites(data: DataStruct) {
    const stringifyData = JSON5.stringify(data);
    const tmp = `${this.filepath}.${Date.now()}.tmp`;

    try {
      fs.writeFileSync(tmp, stringifyData);
      fs.renameSync(tmp, this.filepath);
    } catch (e) {
      throw new Error("Atomic write failed");
    }
  }

  //write ready data to file
  private writeReadyElements() {
    const entries = this._cache.entries();
    let dataToWrite: DataStruct = {};
    //pick data
    for (const entrie of entries) {
      const [key, { isWritten, value }] = entrie;
      if (!isWritten) continue;
      dataToWrite[key] = value;
    }
    //atomic write
    this.atomicWrites(dataToWrite);
  }

  //search key in merge
  private searchKeyInMerge(key: string, merge: Merge): DataStruct | undefined {
    const target = this._cache.get(key);
    if (!target) return undefined;

    if (merge === "written" && target?.isWritten) {
      return { key, value: target.value };
    }

    if (merge === "unwritten" && !target?.isWritten) {
      return { key, value: target?.value };
    }
  }

  //write Changes
  public writeChanges() {
    let shouldRewrite = false;
    const dataToWrite: DataStruct = {};
    // collecting data from cache
    for (const [key, entry] of this._cache) {
      dataToWrite[key] = entry.value;
      if (!entry.isWritten) {
        shouldRewrite = true;
      }
    }
    //check if should write
    if (!shouldRewrite) return;
    //atomic
    this.atomicWrites(dataToWrite);
    //write to cache after atomic Writes success
    for (const [, entry] of this._cache) {
      entry.isWritten = true;
    }
  }
  //return data
  public data(options?: DataOtpions): DataStruct {
    const writtenOnly = options?.writtenOnly ?? false;
    const entries = this._cache.entries();
    const result: DataStruct = {};

    for (const entrie of entries) {
      const [key, { isWritten, value }] = entrie;
      if (!isWritten && writtenOnly) continue;
      result[key] = value;
    }

    return result;
  }

  //get data
  public get<T extends unknown>(key: string): T | undefined {
    return this._cache.get(key)?.value as T;
  }

  //set or update data
  public set(key: string, newValue: any, options?: SetOptions5): void {
    const writeInFile = options?.write ?? false;
    this._cache.set(key, { isWritten: writeInFile, value: newValue });
    if (writeInFile) this.writeReadyElements();
  }

  // has key
  public has(key: string, options?: HasOptions5): boolean {
    const wrinttenMergeOnly = options?.wrinttenOnlyMerge ?? false;
    if (!wrinttenMergeOnly) return this._cache.has(key);
    const search = this.searchKeyInMerge(key, "written");
    return search ? true : false;
  }

  //delete key
  public delete(key: string, options?: DeleteOptions5): void {
    const writeInFile = options?.write ?? false;
    if (!this._cache.has(key)) return;
    this._cache.delete(key);
    if (writeInFile) this.writeReadyElements();
  }

  //is null
  public isNull(key: string): boolean {
    return this._cache.get(key)?.value === null;
  }

  //is not null
  public isNonNull(key: string): boolean {
    return this._cache.get(key)?.value !== null;
  }

  //set many
  public setMany(lines: Line[], options: SetManyOptions5): void {
    const writeInFile = options.write ?? false;
    const onConflit = options.onConflit;
    for (const line of lines) {
      const { key, value } = line;
      const cacheLine = this._cache.get(key);
      if (!cacheLine) {
        this._cache.set(key, { value, isWritten: writeInFile });
        continue;
      }
      if (onConflit === "update") {
        this._cache.set(key, { value, isWritten: writeInFile });
        continue;
      }
    }
    if (writeInFile) this.writeReadyElements();
  }

  //get many
  public getMany<T extends unknown[]>(...keys: string[]): T {
    const result = [];
    for (const key of keys) {
      const cacheLine = this._cache.get(key);
      result.push(cacheLine?.value);
    }
    return result as T;
  }
}

export { Json5 };
