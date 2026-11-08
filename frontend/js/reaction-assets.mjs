const images=new Map();
export function loadReactionImage(path){
  if(!path)return Promise.resolve(null);
  if(!images.has(path))images.set(path,new Promise(resolve=>{
    const image=new Image();image.onload=()=>resolve(image);
    image.onerror=()=>{images.delete(path);resolve(null);};
    image.src=new URL(path,import.meta.url).href;
  }));
  return images.get(path);
}
