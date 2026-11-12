import LibErr from "./err";
import fs from "fs";
import type { JsonVersion } from "./main.types";
import JSON5 from "json5";
import { randomUUID } from "crypto";

export const WRITED_PRFX = "<1>";
export const UNWRITED_PRFX = "<0>";

// writes atomic
export function writeAtomic(fp: string, content: string) {
  const tmp = `${fp}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, content);
    const fd = fs.openSync(tmp, "r+");
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, fp);
  } catch (error) {
    try { fs.rmSync(tmp, { force: true }); } catch {}
    throw new LibErr(
      `Atomic write failed in file: ${fp} (${(error as Error).message})`,
    );
  }
}

//convert key to 2 smart keys
export function convert2SmartKeys(key: string) {
  return {
    Kwrited: `${WRITED_PRFX}${key}`,
    Kunwrited: `${UNWRITED_PRFX}${key}`,
  };
}

// stringify by JSON version
export function stringifyByJsonVersion(data: any, v: JsonVersion) {
  const stringifyFunc = v === 0 ? JSON.stringify : JSON5.stringify;
  return stringifyFunc(data, null, 2) ?? "{}";
}

//Parse by json version
export function parseByJsonVersion(content: string, v: JsonVersion) {
  return v === 0 ? JSON.parse(content) : JSON5.parse(content);
}
