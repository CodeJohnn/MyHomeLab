import {mkdir,writeFile} from 'node:fs/promises';
import {nobleTitles,nobleCrestSvg} from '../frontend/js/nobility.mjs';
const directory=new URL('../frontend/assets/nobility/',import.meta.url);await mkdir(directory,{recursive:true});
for(const title of nobleTitles)await writeFile(new URL(title.id+'.svg',directory),nobleCrestSvg(title.minLevel));
