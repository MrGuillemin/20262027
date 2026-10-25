const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/lessons.json'),'utf8'));
function loadLesson(entry){let lesson;vm.runInNewContext(fs.readFileSync(path.join(root,entry.path,entry.script),'utf8'),{window:{EnglishPractice:{mount:config=>{lesson=config;}}}});return JSON.parse(JSON.stringify(lesson));}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(entry=>!['.git','node_modules'].includes(entry.name)).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
function memoryStorage(){const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};}
module.exports={root,manifest,loadLesson,walk,memoryStorage};
