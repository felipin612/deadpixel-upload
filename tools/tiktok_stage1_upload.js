const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<20&&!document.querySelector('input[type=file][accept^="video"]');i++) await sleep(500);
const db=await new Promise((res,rej)=>{const q=indexedDB.open('dpq',1);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});
const b=await new Promise((res,rej)=>{const q=db.transaction('f').objectStore('f').get(window.__K);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});
const inp=document.querySelector('input[type=file][accept^="video"]');
const dt=new DataTransfer(); dt.items.add(new File([b],window.__N,{type:'video/mp4'})); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true}));
let ok=false; for(let i=0;i<40;i++){ if(/Uploaded/.test(document.body.innerText)&&document.querySelector('.public-DraftEditor-content')){ok=true;break;} await sleep(500);}
await sleep(1500);
const m=[...document.querySelectorAll('[role=dialog], .TUXModal')].find(x=>x.offsetParent&&/automatic content checks/i.test(x.innerText)); if(m){[...m.querySelectorAll('button')].find(b=>/Cancel/.test(b.innerText))?.click(); await sleep(800);}
const ed=document.querySelector('.public-DraftEditor-content'); ed.scrollIntoView({block:'center'}); await sleep(400); const r=ed.getBoundingClientRect();
({ok, size:b.size, x:Math.round(r.x+80), y:Math.round(r.y+12)})
