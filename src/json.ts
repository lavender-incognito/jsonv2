import fs from "fs";
import type { Line, OpenOptions, Separators } from "./types";

export class Json {
  private fileContent: any;
  private filepath: string;
  private separator: string;

  constructor(filepath: string, separator: Separators) {
    this.filepath = filepath;
    this.separator = separator;
    this.fileContent = this.load();
  }

  //static open file Func();
  static openFile(filepath: string, options: OpenOptions):Json {
    if (!filepath.endsWith(".json")) {
      throw new Error("Filepath must end with .json");
    }

    if (!fs.existsSync(filepath)) {
      if (!options.createOnMissing) {
        throw new Error(`Json file: ${filepath} doesn't exist`);
      }

      fs.writeFileSync(filepath, JSON.stringify({}, null, 2));
    }
    return new Json(filepath, options.separator);
  }

  //load content
  private load(): any {
    return JSON.parse(fs.readFileSync(this.filepath, "utf-8"));
  }

  //save to file
  public save(): void {
    fs.writeFileSync(this.filepath, JSON.stringify(this.fileContent, null, 2));
  }

  //get key
  public get<T extends unknown>(key: string): T {
    return this.fileContent[key];
  }

  //set or update value with key
  public set(key: string, value: any, save?: boolean): void {
    this.fileContent[key] = value;
    if (save) this.save();
  }

  //has key
  public has(key: string): boolean {
    return key in this.fileContent;
  }

  //delete key
  public delete(key: string, save?: boolean): void {
    if (key in this.fileContent) {
      delete this.fileContent[key];
      if (save) this.save();
    }
  }

  //is Null
  public isNull(key: string): boolean {
    return this.fileContent[key] === null;
  }

  //is Non null
  public isNonNull(key: string): boolean {
    return this.fileContent[key] !== null;
  }

  //set many
  public setMany(lines: Line[], save?: boolean): void {
    lines.forEach((line) => {
      this.fileContent[line.key] = line.value;
    });
    if (save) this.save();
  }

  //get many
  public getMany<T extends unknown[]>(...keys: string[]): T {
    const result = [];
    for (const key of keys) {
      result.push(this.fileContent[key]);
    }
    return result as T;
  }

  //get deep path
  public getPath<T extends unknown>(path: string): T | undefined {
    let pathArray = path.split(this.separator);
    if (!pathArray || pathArray.length <= 1) return undefined;

    let dataPoint = this.fileContent[pathArray[0]!];
    if (!dataPoint) return undefined;

    pathArray.shift();

    for (const i of pathArray) {
      if (typeof dataPoint !== "object" || !(i in dataPoint)) {
        return undefined;
      }
      dataPoint = dataPoint[i];
    }
    return dataPoint as T;
  }
}
