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
import {Json} from "@djn/jsonv2"

const instance = Json.openFile("./file.json", {
  createOnMissing: true,
  separator: "/",
});


//classic apis:
// set
instance.set(key:string, value:any , save?:boolean);
// get 
instance.get<string>(key: string);
// has
instance.has(key: string);
// del
instance.delete(key: string , save?:boolean);

//save edits 
 instance.save();
```