import fs from "fs";
import handler from "./handler.js";
import "./lib/template.js";

import {
  arr2map,
  buildTreeData,
  eachRecord,
  filterRecord,
  findRecord,
} from "./lib/treeUtils.js";

import data from "./mock/data.json" assert { type: "json" };
const template = fs.readFileSync("mock/template.json", "utf8");
global.$fn = {
  buildTreeData,
  eachRecord,
  filterRecord,
  findRecord,
  arr2map,
  json: JSON.stringify,
  jsonFmt: (obj) => JSON.stringify(obj, null, "\t"),
};

const result = handler(data, template);
//console.log(result);
