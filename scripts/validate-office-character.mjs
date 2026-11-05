import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateOfficeClips} from '../frontend/js/office-character-state.mjs';

export function inspectOfficeGlb(buffer){
  if(buffer.length<20||buffer.readUInt32LE(0)!==0x46546c67||buffer.readUInt32LE(4)!==2||buffer.readUInt32LE(8)!==buffer.length)throw new Error('GLB 2.0 inválido.');
  if(buffer.readUInt32LE(16)!==0x4e4f534a)throw new Error('Primeiro chunk deve ser JSON.');
  const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
  if(!json.skins?.length||!json.nodes?.some(node=>node.skin!==undefined&&node.mesh!==undefined))throw new Error('Malha com skin obrigatória.');
  if([...(json.buffers||[]),...(json.images||[])].some(value=>value.uri&&!value.uri.startsWith('data:')))throw new Error('Inclua buffers e texturas no GLB.');
  validateOfficeClips(json.animations||[]);
  let triangles=0;
  for(const mesh of json.meshes||[])for(const primitive of mesh.primitives){
    if(primitive.mode!==undefined&&primitive.mode!==4)throw new Error('Exporte malhas trianguladas.');
    triangles+=(json.accessors[primitive.indices??primitive.attributes.POSITION].count/3);
  }
  return {bytes:buffer.length,triangles,skins:json.skins.length,clips:json.animations.map(clip=>clip.name),warnings:[...(buffer.length>5*1024*1024?['Arquivo acima da meta de 5 MiB.']:[]),...(triangles>40000?['Acima da meta de 40 mil triângulos; medir no celular.']:[])]};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const file=process.argv[2];
  if(!file)throw new Error('Uso: node scripts/validate-office-character.mjs caminho/personagem.glb');
  console.log(JSON.stringify(inspectOfficeGlb(await readFile(file)),null,2));
}
