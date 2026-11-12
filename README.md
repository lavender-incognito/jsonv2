# **@lavender/jsonv2**

[![JSR](https://jsr.io/badges/@lavender/jsonv2)](https://jsr.io/@djn/jsonv2)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=Bun&logoColor=white)](https://bun.sh)

A small, typed JSON / JSON5 file store with an explicit pending/persisted model
and atomic writes.

## Features

- One API for both JSON and JSON5 files
- Explicit two-layer state: pending (unwritten) and persisted (written) values
- Atomic writes: temp file, `fsync`, then `rename`
- Automatic rollback when a write fails
- Typed API with generics
- Works with Bun and Node.js

## Installation

```bash
bunx jsr add @lavender/jsonv2
```

## Quick start

```ts
import { Jsp } from "@djn/jsonv2";

// JSON
const db = Jsp.json("./data.json");

// JSON5
const config = Jsp.json5("./config.json5");
```

The file must already exist. The extension is validated: `.json` for `Jsp.json`
and `.json5` for `Jsp.json5`.

## Reading values

```ts
const username = db.get<string>("username"); // string | undefined
const values = db.getMany("age", "username"); // unknown[]
```

`get` returns `undefined` only when the key does not exist. A stored `null` is
returned as `null`, not `undefined`.

## Writing values

```ts
// Memory only: not persisted yet
db.set("username", "lavender");

// Persist immediately
db.set("age", 19, { write: true });

// Remove from memory only
db.delete("username");

// Remove and persist the change
db.delete("age", { write: true });
```

`write: true` persists the whole written layer, not only the key you changed.

### Persist everything

To flush the entire in-memory state, including pending (unwritten) values, use
`writeAll()`:

```ts
db.set("username", "lavender"); // pending, not on disk
db.writeAll(); // persists every key and marks it as written
```

After a successful `writeAll()`, every key in memory is in the written layer.

## Written vs unwritten

Every key lives in one of two layers:

| Layer     | Meaning                              |
| --------- | ------------------------------------ |
| unwritten | exists only in memory, not persisted |
| written   | persisted in the file                |

- Loading a file marks every key as written.
- `set(key, value)` without `write` stores the key as unwritten and removes any
  previous layer for that key.
- A write persists only written keys; unwritten keys are left out of the file.
- `writeAll()` persists both layers and promotes every key to written.
- A failed write rolls the key back to its previous state and throws
  `JsonV2Err`.

## Checking keys

```ts
db.has("age"); // exists in either layer
db.has("age", { merge: "file" }); // persisted (written layer)
db.has("age", { merge: "memory" }); // pending (unwritten layer)
```

`merge` defaults to `"both"`.

## Null checks

```ts
db.set("token", null, { write: true });

db.isNull("token"); // true
db.isNotNull("token"); // false

db.isNull("missing"); // false
db.isNotNull("missing"); // false
```

Both methods return `false` when the key does not exist.

## Errors

All errors are instances of `JsonV2Err` (`error.name === "JsonV2Err"`). They are
thrown when:

- the file extension is wrong
- the file does not exist
- the file contains invalid JSON / JSON5
- the file root is not an object
- an atomic write fails
- a `set` or `delete` write fails (the previous state is restored)

## Types

```ts
import type {
  JsonVersion,
  Merge,
  SetApiOptions,
  HasApiOptions,
  DeleteApiOptions,
} from "@djn/jsonv2";
```

## Notes

- Keys are flat; deep/dotted paths are not implemented yet.
- Files are not watched. Changes made by other processes after opening are not
  reloaded.
