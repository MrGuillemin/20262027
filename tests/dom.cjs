/* Minimal DOM adapter for interaction tests; not a layout/browser emulator. */
class Element {
  constructor(tag,document){this.tagName=tag.toUpperCase();this.ownerDocument=document;this.children=[];this.parentElement=null;this.attributes={};this.listeners={};this._text='';this._value='';this._checked=false;this.className='';this.id='';}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  set value(value){this._value=String(value);}
  get value(){return this._value;}
  set checked(value){if(value&&this.type==='radio')this.ownerDocument.querySelectorAll('input').filter(input=>input!==this&&input.name===this.name).forEach(input=>{input._checked=false;});this._checked=Boolean(value);}
  get checked(){return this._checked;}
  append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
  appendChild(child){this.append(child);return child;}
  replaceChildren(...children){for(const child of this.children)child.parentElement=null;this.children=[];this._text='';this.append(...children);}
  replaceWith(element){const siblings=this.parentElement.children;const index=siblings.indexOf(this);siblings[index]=element;element.parentElement=this.parentElement;this.parentElement=null;}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){if(name==='id')return this.id||null;if(name==='class')return this.className||null;if(name==='for')return this.htmlFor||null;return this.attributes[name]??null;}
  removeAttribute(name){delete this.attributes[name];}
  addEventListener(name,callback){(this.listeners[name]||=[]).push(callback);}
  dispatchEvent(event){for(const callback of this.listeners[event.type]||[])callback({...event,target:this});}
  click(){this.dispatchEvent({type:'click'});}
  focus(){this.ownerDocument.activeElement=this;}
  matches(selector){
    const attrs=[...selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)];
    selector=selector.replace(/\[[^\]]+\]/g,'');
    for(const [,name,value] of attrs){const actual=this.getAttribute(name)??this[name];if(value===undefined?actual===null||actual===undefined||actual==='':String(actual)!==value)return false;}
    const id=selector.match(/#([\w-]+)/);if(id&&this.id!==id[1])return false;
    for(const match of selector.matchAll(/\.([\w-]+)/g))if(!this.className.split(/\s+/).includes(match[1]))return false;
    const tag=selector.match(/^[\w-]+/);return !tag||this.tagName===tag[0].toUpperCase();
  }
  querySelectorAll(selector){
    const selectors=selector.split(',').map(value=>value.trim().split(/\s+/));
    const result=[];
    function visit(element){for(const child of element.children){if(selectors.some(parts=>{if(!child.matches(parts.at(-1)))return false;let parent=child.parentElement;for(let i=parts.length-2;i>=0;i--){while(parent&&!parent.matches(parts[i]))parent=parent.parentElement;if(!parent)return false;parent=parent.parentElement;}return true;}))result.push(child);visit(child);}}
    visit(this);return result;
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
class Document extends Element {
  constructor(){super('document',null);this.ownerDocument=this;this.body=this.createElement('body');this.append(this.body);const notice=this.createElement('p');notice.id='progressNotice';const exercises=this.createElement('div');exercises.id='exercises';this.body.append(notice,exercises);}
  createElement(tag){return new Element(tag,this);}
  createTextNode(text){const node=new Element('#text',this);node.textContent=text;return node;}
  getElementById(id){return this.querySelector('#'+id);}
}
module.exports={Document};
