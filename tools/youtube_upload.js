// Run in the YouTube Studio tab opened at /channel/<ID>/videos/upload?d=ud (built-in browser).
// Set window.__P = {file, fname, title, desc, tags, cover?} first. Files are read from the
// public repo at RAW (CORS allowed in Studio). Before running, do one REAL click into the page
// so document.hasFocus() is true (execCommand needs focus).
const RAW='https://raw.githubusercontent.com/felipin612/deadpixel-upload/main/v/';
const P=window.__P, sleep=ms=>new Promise(r=>setTimeout(r,ms));
const parts=P.parts||[P.file]; const blobs=[]; for(const p of parts) blobs.push(await (await fetch(RAW+p)).blob());
window.__pending=new File(blobs,P.fname,{type:'video/mp4'});
if(!window.__origClick){window.__origClick=HTMLInputElement.prototype.click;
 HTMLInputElement.prototype.click=function(){ if(this.type==='file'&&window.__pending){const dt=new DataTransfer();dt.items.add(window.__pending);this.files=dt.files;window.__pending=null;setTimeout(()=>this.dispatchEvent(new Event('change',{bubbles:true})),50);return;} return window.__origClick.call(this);};}
let d; for(let i=0;i<20&&!(d=document.querySelector('ytcp-uploads-dialog'));i++) await sleep(500);
(d.querySelector('#select-files-button')||[...d.querySelectorAll('ytcp-button,button')].find(b=>/Seleccionar archivos|Select files/i.test(b.innerText))).click();
const stem=P.fname.replace(/\.mp4$/,'');
let boxes=[]; for(let i=0;i<80;i++){boxes=[...d.querySelectorAll('#textbox[contenteditable=true]')]; if(boxes.length>=2&&boxes[0].innerText.trim()===stem) break; await sleep(500);}
const setBox=(b,t)=>{b.focus();const s=getSelection(),r=document.createRange();r.selectNodeContents(b);s.removeAllRanges();s.addRange(r);document.execCommand('insertText',false,t);b.dispatchEvent(new Event('input',{bubbles:true}));};
setBox(boxes[0],P.title); await sleep(300); setBox(boxes[1],P.desc); await sleep(500);
if(P.cover){const cb=await (await fetch(RAW+P.cover)).blob(); window.__pending=new File([cb],P.cover,{type:cb.type}); [...d.querySelectorAll('button')].find(x=>/Subir archivo|Upload file/i.test(x.innerText))?.click(); await sleep(3000);}
const R=()=>[...d.querySelectorAll('tp-yt-paper-radio-button')];
if(!R().some(x=>/^(Sí|Yes)$/.test(x.innerText.trim()))){d.querySelector('#toggle-button').click(); await sleep(1200);}
R().find(x=>/^No, (no es contenido|it's not made)/i.test(x.innerText.trim()))?.click();
R().find(x=>/^No, mi video no incluye|^No, my video/i.test(x.innerText.trim()))?.click();
R().find(x=>/^(Sí|Yes)$/.test(x.innerText.trim()))?.click();  // AI / synthetic content disclosure
const ti=d.querySelector('input[aria-label="Etiquetas"],input[aria-label="Tags"]'); ti.focus(); ti.select(); document.execCommand('insertText',false,P.tags+','); ti.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true})); ti.blur(); await sleep(700);
const chk={title:boxes[0].innerText===P.title, desc:boxes[1].innerText.length>50, chips:d.querySelectorAll('ytcp-chip-bar ytcp-chip').length, on:R().filter(x=>x.getAttribute('aria-checked')==='true').map(x=>x.innerText.trim().slice(0,12))};
const ok=chk.title&&chk.desc&&chk.chips>0&&chk.on.length>=4;
let link=[...d.querySelectorAll('a')].map(a=>a.href).find(h=>/youtu\.be|shorts/.test(h)), published=false;
if(ok){ d.querySelector('#step-badge-3').click(); await sleep(1500); const pub=d.querySelector('tp-yt-paper-radio-button[name="PUBLIC"]'); pub.click(); await sleep(700);
  if(pub.getAttribute('aria-checked')==='true'){ d.querySelector('#done-button').click(); await sleep(5000); published=true; } }
({chk, ok, link, published})  // never report published unless published===true; then confirm in the content list
