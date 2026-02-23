"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("node:fs");
var data = fs.readFileSync("../transactions.json", { encoding: "utf-8" });
console.log(data);
console.log(111);
