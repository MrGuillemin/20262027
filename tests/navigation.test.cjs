const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {root,manifest,loadLesson,walk}=require('./helpers.cjs');
const html=walk(root).filter(file=>file.endsWith('.html'));
test('all twenty-four pages and their links resolve under both the production and a preview prefix',()=>{
  assert.equal(html.length,24);
  for(const prefix of ['/20262027/','/preview/'])for(const file of html){const relative=path.relative(root,file).split(path.sep).join('/'),source=fs.readFileSync(file,'utf8');
    for(const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
      const reference=match[1];assert.ok(!reference.startsWith('/'),relative+' hardcoded root URL');
      const target=new URL(reference,'https://example.test'+prefix+relative);assert.ok(target.pathname.startsWith(prefix));
      let resolved=path.join(root,target.pathname.slice(prefix.length));if(target.pathname.endsWith('/'))resolved=path.join(resolved,'index.html');
      assert.ok(fs.existsSync(resolved),relative+' missing '+reference);
      if(reference.startsWith('#'))assert.ok(source.includes('id="'+target.hash.slice(1)+'"'));
    }
    assert.match(source,/<html lang="en">/);assert.doesNotMatch(source,/<style\b|<script\s*>|\sonclick=/);
  }
});
test('every lesson has breadcrumbs and links to every sibling, with the active lesson marked',()=>{
  for(const entry of manifest){const source=fs.readFileSync(path.join(root,entry.path,'index.html'),'utf8');
    assert.match(source,/href="\.\.\/\.\.\/\.\.\/">Toutes les classes/);assert.match(source,/href="\.\.\/\.\.\/">/);assert.match(source,/href="\.\.\/">Unit 1/);
    for(const sibling of manifest.filter(other=>other.className===entry.className))assert.ok(source.includes('href="../'+sibling.path.split('/').at(-1)+'/"'));
    assert.ok(source.includes('href="../'+entry.path.split('/').at(-1)+'/" aria-current="page"'));
    assert.ok(source.includes('src="'+entry.script+'?v='));
  }
});
test('every generated page has fresh asset versions and readable exercises if scripts fail',()=>{
  const crypto=require('node:crypto');
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);
  for(const entry of manifest){const source=fs.readFileSync(path.join(root,entry.path,'index.html'),'utf8');
    const lesson=loadLesson(entry);
    assert.equal((source.match(/class="exercise fallback-exercise"/g)||[]).length,lesson.exercises.length);
    assert.match(source,/assets\/js\/app.js\?v=[a-f0-9]{12}/);
    assert.match(source,/assets\/css\/style.css\?v=[a-f0-9]{12}/);
    assert.ok(source.includes('assets/js/app.js?v='+hash('assets/js/app.js')));
    assert.ok(source.includes('assets/css/style.css?v='+hash('assets/css/style.css')));
    assert.ok(source.includes(entry.script+'?v='+hash(entry.path+'/'+entry.script)));
    for(const exercise of lesson.exercises)assert.ok(source.includes('id="'+exercise.id+'"'));
  }
});
test('shared and class-specific JavaScript is syntactically valid',()=>{
  for(const file of walk(root).filter(file=>file.endsWith('.js')))assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}));
});
test('referenced lesson images exist in a complete checkout',{skip:process.env.SITE_ALLOW_MISSING_BINARY==='1'?'The connector text snapshot excludes the unchanged binary image.':false},()=>{
  for(const entry of manifest)for(const exercise of loadLesson(entry).exercises)if(exercise.image)assert.ok(fs.existsSync(path.join(root,entry.path,exercise.image)),entry.path+' missing '+exercise.image);
});
