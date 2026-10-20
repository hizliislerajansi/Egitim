const ts=require('typescript'),fs=require('fs'),path=require('path');
function neutral(text){return text
 .replace(/Google AI Studio/g,'Google ses paneli')
 .replace(/(?:Yapay [Zz]ek[âa]|yapay zek[âa]|YAPAY ZEK[ÂA]) (?:Öğretmeni|öğretmeni|ÖĞRETMENİ|ÖĞRETMEN|Öğretmen|öğretmen)/g,'Öğretmen')
 .replace(/AI öğretmenim/g,'Öğretmenim').replace(/AI [Öö]ğretmeni/g,'Öğretmen').replace(/AI Öğretmenden/g,'Öğretmenden')
 .replace(/AI ile /g,'').replace(/Bulut AI/g,'Çevrim içi servis').replace(/AI yanıtı/g,'Yanıt').replace(/AI geri bildirimi/g,'Öğretmen geri bildirimi')
 .replace(/yapay zek[âa]nın/g,'rehberin').replace(/Yapay zek[âa]nın/g,'Rehberin')
 .replace(/yapay zek[âa]ya/g,'rehberine').replace(/Yapay zek[âa]ya/g,'Rehberine')
 .replace(/yapay zek[âa]dan/g,'rehberden').replace(/Yapay zek[âa]dan/g,'Rehberden')
 .replace(/yapay zek[âa]/gi,'ders rehberi').replace(/YAPAY ZEK[ÂA]/g,'DERS REHBERİ')
 .replace(/\bAI\b/g,'Rehber')
 .replace(/Yanıt bekleniyor…|İpucu bekleniyor…|Bekleniyor\.\.\.|Öğretmen Düşünüyor\.\.\./g,'Hazırlanıyor…');}
const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx$/.test(p))files.push(p);}}walk('src/components');files.push('src/App.tsx');
for(const name of ['types/settings','services/mediaCatalog','services/apiClient','services/mediaService','services/educationalMaterials','services/materialLibraryService','services/englishLearning','services/englishAiGenerator','services/demoDataManager','data/educationalCatalog'])files.push('src/'+name+'.ts');
let count=0;
for(const file of files){let source=fs.readFileSync(file,'utf8');const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),edits=[];
 function visit(node){if(ts.isStringLiteralLike(node)||ts.isJsxText(node)||[ts.SyntaxKind.TemplateHead,ts.SyntaxKind.TemplateMiddle,ts.SyntaxKind.TemplateTail].includes(node.kind)){
  const raw=node.getText(tree);if(!raw.includes('http://')&&!raw.includes('https://')){const next=neutral(raw);if(next!==raw)edits.push([node.getStart(tree),node.end,next]);}
 }ts.forEachChild(node,visit);}visit(tree);
 if(edits.length){for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+text+source.slice(end);fs.writeFileSync(file,source);count+=edits.length;}
}
console.log('Updated',count,'student-facing text fragments; identifiers, storage keys and URLs retained.');
