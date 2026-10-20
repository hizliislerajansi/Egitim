import {expect,it} from 'vitest';
import {beginPreparation,preparationSnapshot,whilePreparing,studentText} from '../services/studentExperience';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
it('keeps the preparing notice until all overlapping work settles, including errors',async()=>{
 const first=beginPreparation('Ses hazırlanıyor…');
 let reject!:(error:Error)=>void;
 const request=whilePreparing('Yanıt hazırlanıyor…',()=>new Promise((_,fail)=>{reject=fail;})).catch(()=>{});
 expect(preparationSnapshot()).toBe('Yanıt hazırlanıyor…');first();first();
 expect(preparationSnapshot()).toBe('Yanıt hazırlanıyor…');reject(new Error('connection failed'));await request;
 expect(preparationSnapshot()).toBe('');
});
it('presents historical generated feedback without rewriting its stored text',()=>{
 const stored='AI öğretmeni: Yapay zekâ yanıtı.';
 expect(studentText(stored)).toBe('Öğretmen: ders rehberi yanıtı.');expect(stored).toBe('AI öğretmeni: Yapay zekâ yanıtı.');
});
it('contains no system branding terms in component text, accessible labels, or tooltips',()=>{
 const files:string[]=[];const walk=(dir:string)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('.tsx'))files.push(file);}};walk('src/components');files.push('src/App.tsx','src/data/englishSources.ts','src/services/mediaCatalog.ts','src/types/settings.ts');
 const failures:string[]=[];
 for(const file of files){const text=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const visit=(node:ts.Node)=>{if(ts.isStringLiteralLike(node)||ts.isJsxText(node)||[ts.SyntaxKind.TemplateHead,ts.SyntaxKind.TemplateMiddle,ts.SyntaxKind.TemplateTail].includes(node.kind)){
   const value=node.getText(tree);if(!/https?:\/\//.test(value)&&(/yapay\s+zek[âa]/i.test(value)||/\bAI\b/.test(value)))failures.push(file+':'+tree.getLineAndCharacterOfPosition(node.getStart(tree)).line);
  }ts.forEachChild(node,visit);};visit(tree);
 }
 expect(failures).toEqual([]);
});
