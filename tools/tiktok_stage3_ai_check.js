// After the caption is typed and committed, turn on the AI label and return the checks. Post with a REAL click on "Post".
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
[...document.querySelectorAll('div,span,button')].find(x=>x.children.length===0&&/^Show more$/.test(x.innerText.trim()))?.click(); await sleep(1000);
const lab=[...document.querySelectorAll('div,span')].find(x=>x.children.length===0&&/^AI-generated content$/.test(x.innerText.trim())); let c=lab,sw=null; for(let i=0;i<6&&c&&!sw;i++){c=c.parentElement; sw=c.querySelector('input[type=checkbox]');}
if(sw&&!sw.checked){sw.click(); await sleep(1200); const m=[...document.querySelectorAll('[role=dialog], .TUXModal')].find(x=>/Labeling AI-generated/.test(x.innerText)); [...(m?m.querySelectorAll('button'):[])].find(b=>/Turn on/i.test(b.innerText))?.click(); await sleep(1000);}
const t=document.body.innerText, i=t.indexOf('PS2.STORIES');
({ai:sw?.checked, everyone:/Who can see this post\nEveryone/.test(t), preview:t.slice(i+12,i+80)})  // preview MUST show the caption, not the file name
