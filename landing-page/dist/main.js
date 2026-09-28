const toggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('.mobile-menu');
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'Open menu':'Close menu');menu.hidden=open;});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu');}));

document.documentElement.classList.add('js');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused=reducedMotion.matches;
const motionToggle=document.querySelector('#motion-toggle');
function applyMotion(){document.documentElement.classList.toggle('motion-paused',motionPaused);motionToggle.setAttribute('aria-pressed',String(motionPaused));motionToggle.innerHTML=motionPaused?'<span aria-hidden="true">▶</span> Resume motion':'<span aria-hidden="true">Ⅱ</span> Pause motion';}
applyMotion();
motionToggle.addEventListener('click',()=>{motionPaused=!motionPaused;applyMotion();});
reducedMotion.addEventListener('change',e=>{motionPaused=e.matches;applyMotion();});
const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target);}});},{threshold:.10});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
// Decorative product motion stops when its section leaves the viewport.
const featureMotionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>entry.target.classList.toggle('is-on-screen',entry.isIntersecting));
},{threshold:.15});
document.querySelectorAll('.story-visual').forEach(el=>featureMotionObserver.observe(el));
const accessDialog=document.querySelector('#access-dialog');
document.querySelector('#open-access').addEventListener('click',()=>accessDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click',()=>accessDialog.close());
document.querySelector('#close-access').addEventListener('click',()=>accessDialog.close());
accessDialog.addEventListener('click',event=>{const rect=accessDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)accessDialog.close();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu');toggle.focus();}});

// These are design previews: validate locally and never transmit the address.
document.querySelectorAll('[data-signup-form]').forEach(form=>{
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    form.querySelector('.signup-status').textContent="Registration is coming soon. This is a preview, so your email hasn't been saved or sent.";
  });
  form.querySelector('[type=submit]').disabled=false;
  form.querySelector('input').addEventListener('input',()=>{form.querySelector('.signup-status').textContent='';});
});

const loader=document.querySelector('#site-loader');
const loaderProgress=document.querySelector('#loader-progress');
let introComplete=false;
let introFrame;
function openSignup(){if(!accessDialog.open)accessDialog.showModal();}
function finishIntro(){
  if(introComplete)return;
  introComplete=true;
  cancelAnimationFrame(introFrame);
  clearTimeout(window.introFallback);
  loader.style.setProperty('--load','100%');
  loaderProgress.textContent='100';
  document.documentElement.classList.remove('intro-pending');
  const exitTime=reducedMotion.matches?0:600;
  if(exitTime)document.documentElement.classList.add('intro-exiting');
  setTimeout(()=>{
    document.documentElement.classList.remove('intro-exiting');
    loader.setAttribute('aria-hidden','true');
    setTimeout(openSignup,reducedMotion.matches?0:200);
  },exitTime);
}
document.querySelector('#skip-intro').addEventListener('click',finishIntro);
if(reducedMotion.matches){finishIntro();}else{
  const introStart=performance.now();
  function advanceIntro(now){
    const fraction=Math.min((now-introStart)/1500,1);
    const progress=Math.round((1-Math.pow(1-fraction,2))*100);
    loader.style.setProperty('--load',`${progress}%`);
    loaderProgress.textContent=String(progress).padStart(2,'0');
    if(fraction<1)introFrame=requestAnimationFrame(advanceIntro);else finishIntro();
  }
  introFrame=requestAnimationFrame(advanceIntro);
}
window.addEventListener('pageshow',event=>{if(event.persisted)openSignup();});

// All product interactions are local illustrations; no app or signup requests.
const tourPanel=document.querySelector('#tour-screen');
const tourTabs=[...document.querySelectorAll('[data-tour-step]')];
const tourPlay=document.querySelector('#tour-play');
const tourNext=document.querySelector('#tour-next');
const tourCaption=document.querySelector('#tour-caption');
const briefFields=document.querySelector('#client-brief .requirements-card').outerHTML;
const propertyCard=document.querySelector('#matching .best-match').outerHTML;
const pipelineExample=document.querySelector('#deals .pipeline-story').innerHTML;
const screenHeading=(label,title,badge='')=>`<div class="screen-heading"><div><span class="ui-eyebrow">${label}</span><h3>${title}</h3></div>${badge?`<span class="status-pill green">${badge}</span>`:''}</div>`;
const tourScreens=[tourPanel.innerHTML,
  screenHeading('CLIENT REQUIREMENTS','Turn the conversation into a client brief.','Ready to review')+`<div class="tour-split"><div><div class="source-message"><span class="ui-label">WHAT SARAH TOLD YOU</span><p>“We want a <mark>2 bed in Dubai Marina</mark>. Around <mark>AED 2 million</mark>, paying <mark>cash</mark>. Ideally <mark>this month</mark>.”</p></div><p class="tour-detail-note"><span class="spark">✳</span> Auto-fill from WhatsApp. Review the requirements before moving on.</p></div>${briefFields}</div>`,
  screenHeading('PROPERTY MATCHING','A shortlist with reasons behind it.','Best fit for Sarah')+`<div class="tour-matching"><div class="tour-client-brief"><div class="message-person"><span class="person-icon">ST</span><div><strong>Sarah Thompson</strong><small>Buyer requirements</small></div></div>${document.querySelector('#client-brief .requirements-grid').outerHTML}</div>${propertyCard}</div>`,
  screenHeading('REPLIES & PROPERTY PACKS','Give the next conversation a head start.','Prepared for your review')+`<div class="tour-reply"><div><div class="draft-copy"><span class="ui-label">SUGGESTED REPLY</span>Hi Sarah, I’ve shortlisted a 2 bed in Marina Gate at AED 1.95M. It fits your budget and has marina views. Would Saturday at 10:00 work for a viewing?</div><p class="tour-detail-note"><span class="spark">✳</span> Review and refine the draft before sending.</p></div><button class="brochure-tile" data-open-pack><span class="file-icon" aria-hidden="true">PDF</span><span><strong>Marina Gate</strong><small>Your branded property pack.<br>Click to preview the brochure.</small></span><span aria-hidden="true">↗</span></button></div>`,
  screenHeading('VIEWINGS','The conversation now has a date.','Viewing booked')+`<div class="tour-calendar"><div class="calendar-week"><div>MON<strong>12</strong></div><div>TUE<strong>13</strong></div><div>WED<strong>14</strong></div><div>THU<strong>15</strong></div><div>FRI<strong>16</strong></div><div class="selected-day">SAT<strong>17</strong></div><div>SUN<strong>18</strong></div></div><div class="schedule-strip"><span class="calendar-badge">SAT<strong>10:00</strong></span><div><strong>Sarah Thompson · Marina Gate</strong><p>2 bedroom apartment · Dubai Marina</p></div><span class="status-pill green">Booked</span></div><p class="tour-detail-note"><span class="spark">✳</span> The viewing stays connected to the client and property.</p></div>`,
  screenHeading('SALES PIPELINE','Keep the deal moving, one stage at a time.','Client + property + next step')+`<div class="tour-board">${pipelineExample}</div>`];
const tourCaptions=['See the enquiry, then follow what happens next.','The important details become a brief you can use.','Understand why each property fits the client.','Prepare the reply and preview the property pack.','Bring the client, property and viewing together.','Follow the opportunity through the sales pipeline.'];
const nextLabels=['Build the client brief','Find a property match','Prepare the reply','Book a viewing','See the deal','Replay the journey'];
let tourIndex=0;
let tourTimer=null;
let tourPlaying=false;
function stopTour(){clearTimeout(tourTimer);tourTimer=null;tourPlaying=false;tourPlay.setAttribute('aria-pressed','false');tourPlay.innerHTML='<span aria-hidden="true">▶</span> Play the workflow';}
function selectTour(index,{focus=false,manual=false}={}){
  if(manual)stopTour();
  tourIndex=index;
  tourTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  tourPanel.setAttribute('aria-labelledby',tourTabs[index].id);
  tourPanel.innerHTML=tourScreens[index];
  tourPanel.classList.remove('screen-enter');void tourPanel.offsetWidth;tourPanel.classList.add('screen-enter');
  tourCaption.textContent=tourCaptions[index];
  tourNext.innerHTML=nextLabels[index]+' <span aria-hidden="true">→</span>';
  document.querySelectorAll('.product-nav>span').forEach((el,i)=>el.classList.toggle('is-active',i===[0,1,2,0,3,4][index]));
  if(focus)tourTabs[index].focus();
}
function scheduleTour(){clearTimeout(tourTimer);tourTimer=setTimeout(()=>{if(tourIndex===5){stopTour();return;}selectTour(tourIndex+1);scheduleTour();},4800);}
function playTour(){if(tourIndex===5)selectTour(0);tourPlaying=true;tourPlay.setAttribute('aria-pressed','true');tourPlay.innerHTML='<span aria-hidden="true">Ⅱ</span> Pause the workflow';scheduleTour();}
tourPlay.addEventListener('click',()=>tourPlaying?stopTour():playTour());
tourNext.addEventListener('click',()=>selectTour((tourIndex+1)%6,{manual:true}));
tourTabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTour(index,{manual:true}));tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%6;else if(event.key==='ArrowLeft')next=(index+5)%6;else if(event.key==='Home')next=0;else if(event.key==='End')next=5;else return;event.preventDefault();selectTour(next,{focus:true,manual:true});});});
document.querySelector('[data-watch-demo]').addEventListener('click',()=>{selectTour(0);playTour();});
document.querySelectorAll('[data-tour-link]').forEach(link=>link.addEventListener('click',()=>selectTour(Number(link.dataset.tourLink),{manual:true})));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTour();});
motionToggle.addEventListener('click',()=>{if(motionPaused)stopTour();});
reducedMotion.addEventListener('change',event=>{if(event.matches)stopTour();});
const packDialog=document.querySelector('#pack-dialog');
document.addEventListener('click',event=>{if(event.target.closest('[data-open-pack]')){stopTour();packDialog.showModal();}if(event.target.closest('[data-close-pack]'))packDialog.close();});
packDialog.addEventListener('click',event=>{const rect=packDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)packDialog.close();});
let polished=false;
const draft=document.querySelector('#draft-copy');
const originalDraft=draft.textContent;
const polishButton=document.querySelector('#polish-demo');
polishButton.addEventListener('click',()=>{polished=!polished;draft.textContent=polished?'Hi Sarah, I’ve found a lovely two-bedroom apartment in Marina Gate for AED 1.95M. It’s within your budget and enjoys marina views. I’d be happy to arrange a viewing this weekend—would Saturday morning suit you?':originalDraft;polishButton.innerHTML=polished?'<span aria-hidden="true">↶</span> Show original draft':'<span aria-hidden="true">✳</span> Polish this reply';draft.classList.remove('polished');void draft.offsetWidth;draft.classList.add('polished');});
