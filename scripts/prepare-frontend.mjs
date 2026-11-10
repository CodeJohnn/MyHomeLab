// The API-only Render service does not install or need frontend build tools.
try{process.loadEnvFile(new URL('../.env',import.meta.url));}
catch(error){if(error.code!=='ENOENT')throw error;}

if(process.env.SERVE_FRONTEND!=='false')await import('./build-react.mjs');
