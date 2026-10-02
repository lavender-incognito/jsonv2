# **@djn/jsonv2**

[![JSR](https://jsr.io/badges/@djn/toolkit)](https://jsr.io/@djn/toolkit)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh)

A simple json file apis , support deep path , +15 api.

## Features

- JSON control
- classic apis (get,set,del,has)
- Compatible with Bunjs && Nodejs
- Deep access layers
- Support types on every api

## Installation

```bash
bunx jsr add @djn/jsonv2
```

### **Example:**

```ts
import { Json } from "@djn/jsonv2";

const db = Json.open("./data.json", {
  createOnMissing: true,
});

// Set a value without writing it to disk
db.set("username", "lavender");

// Set a value and persist it immediately
db.set("age", 19, { write: true });

// Read a value
const username = db.get<string>("username");

// Check whether a key exists
const exists = db.has("username");

// Check whether a key is persisted
const persisted = db.has("age", {
  wrinttenOnlyMerge: true,
});

// Set multiple values at once
db.setMany(
  [
    { key: "country", value: "Morocco" },
    { key: "language", value: "English" },
    { key: "age", value: 20 },
  ],
  {
    write: true,
    onConflit: "update", // or skip 
  },
);

// Read multiple values
const [country, language, age] = db.getMany<string[]>(
  "country",
  "language",
  "age",
);

// Read all cached data
const data = db.data();

// Read only persisted data
const persistedData = db.data({
  writtenOnly: true,
});

// Check for null values
db.set("token", null);

const isNull = db.isNull("token");
const isNotNull = db.isNonNull("token");

// Remove a value
db.delete("token");

// Remove a value and persist the change
db.delete("age", { write: true });

// Persist any pending changes
db.writeChanges();
```
