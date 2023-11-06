import fs from 'fs';
import _ from 'lodash';
import data from './mock/data.js';
const template=fs.readFileSync("mock/template.json", 'utf8');

const vs= _.values(  data);
const ks= _.keys( data );
 console.log( template.length);
// console.log( data);
console.log( ks);
