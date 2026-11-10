import {trackMobileViewport} from '../js/mobile-viewport.mjs';
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import LandingPage from './LandingPage.jsx';
import {initializeLanding} from '../js/landing.mjs?v=react-1';

const viewport=trackMobileViewport();
const stopViewport=event=>{if(!event.persisted){viewport.dispose();removeEventListener('pagehide',stopViewport);}};
addEventListener('pagehide',stopViewport);
const host=document.getElementById('landing');
const root=createRoot(host);
let controller;
let updateStatus;

function App(){
  const [status,setStatus]=useState({busy:false,message:''});
  updateStatus=setStatus;
  return <LandingPage {...status} onEnter={()=>controller?.enter()} />;
}

// Mount before the existing profile/auth integration queries its DOM.
flushSync(()=>root.render(<App />));
controller=initializeLanding({
  host,
  onStatus:status=>updateStatus(status),
  onWorldEntry:()=>root.unmount()
});
