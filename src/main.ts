import LibErr from "./err";
import fs from "fs";
import type {
  DeleteApiOptions,
  HasApiOptions,
  JsonVersion,
  ReloadApiOptions,
  SetApiOptions,
} from "./main.types";
import {
  writeAtomic,
  convert2SmartKeys,
  WRITED_PRFX,
  UNWRITED_PRFX,
  stringifyByJsonVersion,
  parseByJsonVersion,
} from "./utilities";

export class Jsp {
  private filepath: string;
  private mem = new Map<string, any>();
  private jv: JsonVersion;

  //constuctor
  private constructor(_path: string, v: JsonVersion) {
    this.filepath = _path;
    this.jv = v;
    this.LoadFromFile();
  }

  //static
  static json5(filepath: string): Jsp {
    if (!filepath.endsWith(".json5")) {
      throw new LibErr("Filepath must ends with .json5");
    }
    if (!fs.existsSync(filepath))
      throw new LibErr(`Filepath not exist:${filepath}`);

    return new Jsp(filepath, 5);
  }
  static json(filepath: string): Jsp {
    if (!filepath.endsWith(".json")) {
      throw new LibErr("Filepath must ends with .json");
    }
    if (!fs.existsSync(filepath))
      throw new LibErr(`Filepath not exist:${filepath}`);
    return new Jsp(filepath, 0);
  }

  //private
  private LoadFromFile() {
    const fileContent = fs.readFileSync(this.filepath, "utf-8");

    let data: any;
    try {
      data = parseByJsonVersion(fileContent, this.jv);
    } catch (error) {
      throw new LibErr(
        `Invalid json${this.jv === 5 ? "5" : ""} syntax: ${this.filepath} (${(error as Error).message})`,
      );
    }
    if (data === null || typeof data !== "object" || Array.isArray(data))
      throw new LibErr(`Invalid root: ${this.filepath}`);

    for (const [key, value] of Object.entries(data)) {
      const { Kwrited } = convert2SmartKeys(key);
      this.mem.set(Kwrited, value);
    }
  }
  private WriteReadyElements() {
    let data: Record<string, any> = {};
    const entries = this.mem.entries();

    for (const entry of entries) {
      const [smartKey, value] = entry;
      if (smartKey.startsWith(UNWRITED_PRFX)) continue;
      data[smartKey.slice(WRITED_PRFX.length)] = value;
    }

    writeAtomic(this.filepath, stringifyByJsonVersion(data, this.jv));
  }
  private lookup(key: string): { found: boolean; value: any } {
    const { Kunwrited, Kwrited } = convert2SmartKeys(key);
    if (this.mem.has(Kwrited))
      return { found: true, value: this.mem.get(Kwrited) };
    if (this.mem.has(Kunwrited))
      return { found: true, value: this.mem.get(Kunwrited) };
    return { found: false, value: undefined };
  }

  //public apis
  public set(key: string, value: any, options?: SetApiOptions): void {
    const write = options?.write ?? false;
    const { Kunwrited, Kwrited } = convert2SmartKeys(key);

    const prevUnwritten = this.mem.has(Kunwrited)
      ? this.mem.get(Kunwrited)
      : undefined;
    const prevWritten = this.mem.has(Kwrited)
      ? this.mem.get(Kwrited)
      : undefined;

    const unwrited_del = this.mem.delete(Kunwrited);
    const writed_del = this.mem.delete(Kwrited);

    this.mem.set(write ? Kwrited : Kunwrited, value);

    if (!write) return;

    try {
      this.WriteReadyElements();
    } catch (e) {
      this.mem.delete(Kwrited);
      this.mem.delete(Kunwrited);

      if (unwrited_del) this.mem.set(Kunwrited, prevUnwritten);
      if (writed_del) this.mem.set(Kwrited, prevWritten);

      throw new LibErr(
        `Set api failed on write to file: ${this.filepath} (${(e as Error).message})`,
      );
    }
  }
  public makeNull(key: string, options?: SetApiOptions): void {
    this.set(key, null, options);
  }
  public get<T = unknown>(key: string): T | undefined {
    const { found, value } = this.lookup(key);
    return found ? (value as T) : undefined;
  }
  public has(key: string, options?: HasApiOptions): boolean {
    const merge = options?.merge ?? "both";
    const { Kwrited, Kunwrited } = convert2SmartKeys(key);
    const unwritedExistance = this.mem.has(Kunwrited);
    const writedExistance = this.mem.has(Kwrited);
    const result =
      (merge === "memory" && unwritedExistance) ||
      (merge === "file" && writedExistance) ||
      (merge === "both" && (writedExistance || unwritedExistance));
    return result;
  }
  public delete(key: string, options?: DeleteApiOptions): void {
    const { Kunwrited, Kwrited } = convert2SmartKeys(key);
    const prevUnwritten = this.mem.has(Kunwrited)
      ? this.mem.get(Kunwrited)
      : undefined;
    const prevWritten = this.mem.has(Kwrited)
      ? this.mem.get(Kwrited)
      : undefined;

    const unwrited_del = this.mem.delete(Kunwrited);
    const writed_del = this.mem.delete(Kwrited);

    if (!writed_del || !options?.write) return;

    try {
      this.WriteReadyElements();
    } catch (e) {
      if (unwrited_del) this.mem.set(Kunwrited, prevUnwritten);
      if (writed_del) this.mem.set(Kwrited, prevWritten);

      throw new LibErr(
        `Delete api failed on write to file: ${this.filepath} (${(e as Error).message})`,
      );
    }
  }
  public isNull(key: string): boolean {
    const { found, value } = this.lookup(key);
    return found && value === null;
  }
  public isNotNull(key: string): boolean {
    const { found, value } = this.lookup(key);
    return found && value !== null;
  }
  public getMany<T extends unknown[]>(...keys: string[]): T {
    return keys.map((key) => this.get(key)) as T;
  }
  public writeAll(): void {
    const data: Record<string, any> = {};

    for (const [smartKey, value] of this.mem) {
      const key = smartKey.startsWith(UNWRITED_PRFX)
        ? smartKey.slice(UNWRITED_PRFX.length)
        : smartKey.slice(WRITED_PRFX.length);
      data[key] = value;
    }

    writeAtomic(this.filepath, stringifyByJsonVersion(data, this.jv));

    // Everything is on disk now: promote pending entries to written.
    for (const [smartKey, value] of [...this.mem]) {
      if (!smartKey.startsWith(UNWRITED_PRFX)) continue;
      this.mem.delete(smartKey);
      this.mem.set(WRITED_PRFX + smartKey.slice(UNWRITED_PRFX.length), value);
    }
  }
  public reload(options: ReloadApiOptions): void {
    // Persist pending (unwritten) changes before discarding them.
    if (options.writePending) this.writeAll();

    if (!fs.existsSync(this.filepath)) {
      throw new LibErr(`Filepath not exist:${this.filepath}`);
    }

    const previous = this.mem;
    try {
      this.mem = new Map<string, any>();
      this.LoadFromFile();
    } catch (error) {
      // Keep the previous state if the file cannot be loaded.
      this.mem = previous;
      throw new LibErr(
        `Failed to reload data from file ${(error as Error).message}`,
      );
    }
  }
}

//add interns + deep paths
