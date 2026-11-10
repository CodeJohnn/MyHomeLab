// Asynchronous WebGL2 timing, enabled only by the opt-in performance monitor.
export function createGpuTimer(renderer){
  const gl=renderer.getContext?.(),extension=gl?.getExtension?.('EXT_disjoint_timer_query_webgl2');
  if(!extension||!gl.createQuery)return {begin(){},end(){},poll:()=>null,dispose(){}};
  const pending=[];let active=null,latest=null;
  function clear(){
    if(active){gl.endQuery(extension.TIME_ELAPSED_EXT);gl.deleteQuery(active);active=null;}
    for(const query of pending)gl.deleteQuery(query);pending.length=0;
  }
  return {
    begin(){if(active||pending.length>=4||gl.isContextLost?.())return;active=gl.createQuery();if(active)gl.beginQuery(extension.TIME_ELAPSED_EXT,active);},
    end(){if(!active)return;gl.endQuery(extension.TIME_ELAPSED_EXT);pending.push(active);active=null;},
    poll(){
      if(gl.isContextLost?.()){clear();latest=null;return null;}
      if(gl.getParameter(extension.GPU_DISJOINT_EXT)){clear();latest=null;return null;}
      while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
        const query=pending.shift(),nanoseconds=gl.getQueryParameter(query,gl.QUERY_RESULT);
        if(Number.isFinite(nanoseconds))latest=nanoseconds/1e6;
        gl.deleteQuery(query);
      }
      return latest;
    },
    dispose:clear
  };
}
