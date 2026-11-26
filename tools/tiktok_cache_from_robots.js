// TikTok Studio's CSP blocks fetch to GitHub. Run this in a tab at https://www.tiktok.com/robots.txt
// (same origin, no CSP): it caches the batch in IndexedDB 'dpq' so TikTok Studio can read it.
// Set window.__FILES=['P1.mp4','S04.mp4',...] first.
const RAW='https://raw.githubusercontent.com/felipin612/deadpixel-upload/main/v/';
const db=await new Promise((res,rej)=>{const q=indexedDB.open('dpq',1);q.onupgradeneeded=()=>q.result.createObjectStore('f');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});
const out={}; for(const f of window.__FILES){const b=await (await fetch(RAW+f)).blob(); await new Promise((res,rej)=>{const t=db.transaction('f','readwrite');t.objectStore('f').put(b,f);t.oncomplete=res;t.onerror=()=>rej(t.error);}); out[f]=b.size;}
out
