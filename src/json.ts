import fs from "fs";
import type { OpenOptions, Separators } from "./types";
import { open } from "inspector/promises";

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
  static openFile(filepath: string, options: OpenOptions) {
    if (!filepath.endsWith(".json")) {
      throw new Error("Filepath must end with .json");
    }

    if (!fs.existsSync(filepath)) {
      if (!options.createOnMissing) {
        throw new Error(`Json file: ${filepath} doesn't exist`);
      }

      fs.writeFileSync(filepath, JSON.stringify({}, null, 2));
      return new Json(filepath, options.separator);
    }
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
  public delete(key: string): void {
    if (key in this.fileContent) delete this.fileContent[key];
  }
}
