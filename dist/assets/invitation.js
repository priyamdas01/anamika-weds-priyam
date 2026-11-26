const root=document.documentElement;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const opening=document.querySelector('.opening-scene');
const heroStage=opening.querySelector('.hero');
const heroSeal=opening.querySelector('.seal');
const alponaLights=heroSeal.querySelector('.alpona-lights');
for(let index=0;index<12;index++){
  const light=document.createElement('i');
  light.style.setProperty('--ray',(index*137.5)+'deg');
  light.style.setProperty('--size',(2+index%3)+'px');
  light.style.setProperty('--duration',(2.8+index%5*.41)+'s');
  light.style.setProperty('--delay',(-index*.79)+'s');
  alponaLights.append(light);
}
const doorScene=document.querySelector('.door-scene');
const stage=document.querySelector('.stage-scene');
const families=document.querySelector('.families-scene');
const entrances=[...document.querySelectorAll('.entrance-scene')];
const storySteps=document.querySelector('.story-steps');
const storyBeats=[...document.querySelectorAll('.story-step')];
const letter=document.querySelector('.letter-scene');
const closing=document.querySelector('.closing');
const rail=[...document.querySelectorAll('.chapter-rail a')];
const sections=rail.map(link=>document.querySelector(link.hash));

const knock=document.querySelector('.knock');
const continueLink=document.querySelector('#continue');
const threshold=doorScene.querySelector('.threshold');
let knocked=false;
function setDoors(open){
  continueLink.inert=!open;
  knock.hidden=open;
}
knock.addEventListener('click',()=>{
  if(threshold.classList.contains('door-knocking'))return;
  threshold.classList.add('door-knocking');
  setTimeout(()=>{
    threshold.classList.remove('door-knocking');
    knocked=true;
    doorScene.classList.add('opened-by-knock');
    setDoors(true);
    draw();
    continueLink.focus({preventScroll:true});
  },motion.matches?0:300);
});
function scale(value,start,end){return Math.min(1,Math.max(0,(value-start)/(end-start)));}
function progress(section){
  return scale(-section.getBoundingClientRect().top,0,Math.max(1,section.offsetHeight-innerHeight));
}
let skipCoverHold=false;
let doorwayArmed=['','#opening','#welcome'].includes(location.hash);
function keepDoorwayClosed(){
  if(knocked||motion.matches)return false;
  const top=doorScene.getBoundingClientRect().top;
  if(skipCoverHold)return false;
  if(top>12)doorwayArmed=true;
  if(!doorwayArmed||top>=-1)return false;
  window.scrollTo({top:Math.round(scrollY+top),behavior:'instant'});
  scheduleDraw();
  return true;
}
function showCoverTransition(cover){
  const blend=scale(cover,.25,.65);
  const redProgress=scale(cover,.65,1);
  opening.style.setProperty('--gold-opacity',1-blend);
  opening.style.setProperty('--light-opacity',blend);
  opening.style.setProperty('--light-turn',(blend*42+redProgress*42)+'deg');
  opening.style.setProperty('--light-scale',.91+blend*.13+redProgress*.12);
}
document.querySelectorAll('.chapter-rail a').forEach(link=>link.addEventListener('click',()=>{
  skipCoverHold=link.hash!=='#opening';
  if(!['#opening','#welcome'].includes(link.hash))doorwayArmed=false;
  if(skipCoverHold)setTimeout(()=>{skipCoverHold=false;},1200);
}));

let frame=0;
function draw(){
  frame=0;
  if(keepDoorwayClosed())return;
  let active=0;
  sections.forEach((section,index)=>{if(section.getBoundingClientRect().top<=innerHeight*.42)active=index;});
  if(innerHeight+scrollY>=root.scrollHeight-4)active=rail.length-1;
  rail.forEach((link,index)=>{if(index===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  root.classList.toggle('reduced-motion',motion.matches);
  if(motion.matches){setDoors(true);return;}
  const cover=progress(opening);
  showCoverTransition(cover);
  opening.style.setProperty('--opening-bg-zoom',1+scale(cover,0,.68)*.18);
  const sceneBounds=heroStage.getBoundingClientRect();
  const sealBounds=heroSeal.getBoundingClientRect();
  const x=sealBounds.left+sealBounds.width/2-sceneBounds.left;
  const y=sealBounds.top+sealBounds.height/2-sceneBounds.top;
  const radius=Math.hypot(Math.max(x,sceneBounds.width-x),Math.max(y,sceneBounds.height-y));
  opening.style.setProperty('--wash-x',x+'px');
  opening.style.setProperty('--wash-y',y+'px');
  const washProgress=scale(cover,.025,.65);
  const feather=Math.min(80,Math.max(34,radius*.09));
  opening.style.setProperty('--wash',washProgress*(radius+feather+8)+'px');
  opening.style.setProperty('--wash-feather',feather+'px');
  opening.style.setProperty('--wash-opacity',scale(washProgress,0,.14));
  const props=scale(cover,.04,.71);
  opening.style.setProperty('--prop-left-x',-props*160+'%');
  opening.style.setProperty('--prop-right-x',props*160+'%');
  opening.style.setProperty('--prop-y',props*45+'%');
  opening.style.setProperty('--prop-left-tilt',-props*12+'deg');
  opening.style.setProperty('--prop-right-tilt',props*12+'deg');
  opening.style.setProperty('--prop-opacity',1-scale(props,.53,1));
  opening.style.setProperty('--seal-spin',cover*64+'deg');
  opening.style.setProperty('--seal-counter',-cover*64+'deg');
  opening.style.setProperty('--cover-ink',cover>.42?'#ffe8ae':'#6f1820');
  opening.style.setProperty('--cover-shift',-cover*36+'px');
  const doorTop=doorScene.getBoundingClientRect().top;
  const arrival=scale(doorTop,0,innerHeight*.54);
  doorScene.style.setProperty('--door-arrival-veil',arrival*.95);
  const door=knocked?1:0;
  doorScene.style.setProperty('--courtyard-zoom',1+progress(doorScene)*.17);
  doorScene.style.setProperty('--door-left',-door*106+'%');
  doorScene.style.setProperty('--door-right',door*106+'%');
  doorScene.style.setProperty('--door-copy',scale(door,.25,.84));
  doorScene.style.setProperty('--door-scale',.9+door*.1);
  doorScene.style.setProperty('--knock-opacity',1-scale(door,.02,.37));
  setDoors(door>.46);
  const theater=progress(stage);
  const curtains=scale(theater,.04,.7);
  const rightCurtain=scale(theater,.065,.73);
  const fabricEase=value=>value*value*(3-2*value);
  stage.style.setProperty('--curtain-left',-fabricEase(curtains)*92+'%');
  stage.style.setProperty('--curtain-right',fabricEase(rightCurtain)*92+'%');
  stage.style.setProperty('--portrait-scale',1+theater*.12);
  stage.style.setProperty('--stage-copy',scale(theater,.40,.88));
  stage.style.setProperty('--stage-shift',(1-scale(theater,.40,.88))*32+'px');

  entrances.forEach((section,index)=>{
    const amount=scale(progress(section),.02,.73);
    section.style.setProperty('--portrait-shutter',amount*(index?-105:105)+'%');
    if(index===1){
      const open=scale(progress(section),.07,.76);
      const spread=open*open*(3-2*open)*83;
      section.style.setProperty('--phool-left',-spread+'%');
      section.style.setProperty('--phool-right',spread+'%');
      section.style.setProperty('--phool-backing',1-scale(open,.03,.48));
      section.style.setProperty('--phool-drift',Math.sin(open*Math.PI)*13+'px');
      section.style.setProperty('--phool-bend',Math.sin(open*Math.PI)*5+'deg');
      section.style.setProperty('--portrait-zoom',1.31-.31*scale(open,.03,.99));
    }
    if(index===0)section.style.setProperty('--portrait-zoom',1+progress(section)*.16);
    section.style.setProperty('--portrait-fade',scale(amount,.25,.68));
    section.style.setProperty('--portrait-shift',(1-amount)*26+'px');
    const drop=scale(progress(section),.27,.92);
    const glide=1-Math.pow(1-drop,2.2);
    section.style.setProperty('--headpiece-opacity',scale(drop,0,.26));
    section.style.setProperty('--headpiece-x',(1-glide)*(index?-56:56)+'px');
    section.style.setProperty('--headpiece-y',-(1-glide)*148+'px');
    section.style.setProperty('--headpiece-tilt',(1-glide)*(index?-16:16)+'deg');
  });
  const thread=scale(theater,.46,.94);
  storySteps.style.setProperty('--story-thread',thread);
  storyBeats.forEach((beat,index)=>{
    const show=scale(thread,index*.24,index*.24+.28);
    beat.style.setProperty('--step-fade',show);
    beat.style.setProperty('--step-shift',(1-show)*14+'px');
  });

  const familyProgress=progress(families);
  const toran=scale(familyProgress,0,.13);
  const heading=scale(familyProgress,.13,.24);
  const art=scale(familyProgress,.24,.43);
  const glide=art*art*(3-2*art);
  const names=scale(familyProgress,.43,.55);
  const corners=scale(familyProgress,.55,.67);
  const ghat=scale(familyProgress,.67,.77);
  const join=scale(familyProgress,.77,.94);
  families.style.setProperty('--toran-drop',-(1-toran)*103+'%');
  families.style.setProperty('--toran-show',toran);
  families.style.setProperty('--family-heading-show',heading);
  families.style.setProperty('--family-heading-y',(1-heading)*18+'px');
  families.style.setProperty('--family-left',-(1-glide)*53+'%');
  families.style.setProperty('--family-right',(1-glide)*53+'%');
  families.style.setProperty('--family-art-show',art);
  families.style.setProperty('--family-names-show',names);
  families.style.setProperty('--family-names-y',(1-names)*10+'px');
  families.style.setProperty('--corner-left',-(1-corners)*111+'%');
  families.style.setProperty('--corner-right',(1-corners)*111+'%');
  families.style.setProperty('--corner-y',(1-corners)*25+'%');
  families.style.setProperty('--corner-opacity',scale(corners,0,.45));
  families.style.setProperty('--family-ghat-show',ghat);
  families.style.setProperty('--family-ghat-y',(1-ghat)*18+'px');
  families.style.setProperty('--family-join',join);
  families.style.setProperty('--family-knot',scale(join,.95,1));
  families.classList.toggle('thread-joined',join>=1);
  const closingProgress=scale(innerHeight-closing.getBoundingClientRect().top,0,innerHeight);
  closing.style.setProperty('--closing-art-zoom',1+closingProgress*.15);
  const cardOpening=scale(progress(letter),.11,.76);
  const cardGlide=cardOpening*cardOpening*(3-2*cardOpening);
  letter.style.setProperty('--book-angle',-cardGlide*112+'deg');
}
function scheduleDraw(){if(!frame)frame=requestAnimationFrame(draw);}
window.addEventListener('scroll',scheduleDraw,{passive:true});
let propIdleTimer;
window.addEventListener('scroll',()=>{
  if(motion.matches)return;
  heroStage.classList.add('is-scrolling');
  clearTimeout(propIdleTimer);
  propIdleTimer=setTimeout(()=>heroStage.classList.remove('is-scrolling'),180);
},{passive:true});
window.addEventListener('resize',scheduleDraw);
motion.addEventListener('change',scheduleDraw);
draw();
const ambient=document.querySelector('.ambient');
for(let index=0;index<11;index++){
  const petal=document.createElement('i');
  petal.textContent=['✿','❋','❧'][index%3];
  petal.style.setProperty('--color',['#b92e49','#dc961d','#fff4d0'][index%3]);
  petal.style.setProperty('--x',(index*29%99)+'%');
  petal.style.setProperty('--duration',(8+index%6)+'s');
  petal.style.setProperty('--delay',(-index*1.37)+'s');
  petal.style.setProperty('--wind',((index%2?-1:1)*(30+index*7))+'px');
  ambient.append(petal);
}

const music=document.querySelector('.music');
const soundtrack=document.querySelector('#soundtrack');
const musicPreference='wedding-music-paused';
let guestPaused=false;
try{guestPaused=localStorage.getItem(musicPreference)==='true';}catch{}
function rememberMusic(paused){
  guestPaused=paused;
  try{localStorage.setItem(musicPreference,String(paused));}catch{}
}
function updateMusic(){
  const playing=!soundtrack.paused;
  music.setAttribute('aria-pressed',String(playing));
  music.setAttribute('aria-label',playing?'Pause wedding song':'Play wedding song');
  music.textContent=playing?'Ⅱ':'♫';
}
function startMusic(){
  if(!guestPaused&&soundtrack.paused)return soundtrack.play().catch(()=>{});
}
function startOnGesture(event){
  if(event.target instanceof Element&&event.target.closest('.music'))return;
  startMusic();
}
music.addEventListener('click',async()=>{
  if(!soundtrack.paused){
    rememberMusic(true);
    soundtrack.pause();
    return;
  }
  rememberMusic(false);
  try{await soundtrack.play();}catch{
    document.querySelector('#music-status').textContent='The wedding song could not be played. Try again in a moment.';
  }
});
for(const event of ['play','pause','ended']) soundtrack.addEventListener(event,updateMusic);
document.addEventListener('click',startOnGesture);
document.addEventListener('keydown',event=>{
  if(!event.repeat&&!['Tab','Shift','Control','Alt','Meta','Escape'].includes(event.key))startOnGesture(event);
});
window.addEventListener('pageshow',startMusic);
startMusic();

const burstLayer=document.querySelector('.burst-layer');
const burstColors=['#d73353','#ffc559','#ec7834','#fff4dd','#a82b48'];
function throwFlowers(x,y,strength=14){
  if(motion.matches)return;
  while(burstLayer.childElementCount+strength>105)burstLayer.firstElementChild.remove();
  for(let index=0;index<strength;index++){
    const seed=document.createElement('span');
    const bloom=document.createElement('i');
    const size=10+Math.random()*15;
    const angle=Math.random()*Math.PI*2;
    const radius=45+Math.random()*110;
    const dx=Math.cos(angle)*radius;
    const dy=Math.sin(angle)*radius;
    const color=burstColors[index%burstColors.length];
    seed.className='burst-seed';
    if(index%5===0)seed.classList.add('marigold');
    else if(index%3===0)bloom.textContent='✿';
    else seed.classList.add('petal-shape');
    seed.style.left=x-size/2+'px';
    seed.style.top=y-size/2+'px';
    seed.style.setProperty('--size',size+'px');
    seed.style.setProperty('--color',color);
    seed.append(bloom);
    burstLayer.append(seed);
    const spin=(Math.random()>.5?1:-1)*(140+Math.random()*370);
    const animation=seed.animate([
      {transform:'translate(0,0) rotate(0deg) scale(.35)',opacity:1},
      {transform:'translate('+dx+'px,'+dy+'px) rotate('+spin*.56+'deg) scale(1)',opacity:1,offset:.39,easing:'ease-in'},
      {transform:'translate('+dx*1.45+'px,'+(dy+145)+'px) rotate('+spin+'deg) scale(.7)',opacity:0}
    ],{duration:800+Math.random()*700,easing:'cubic-bezier(.15,.62,.3,1)'});
    animation.onfinish=()=>seed.remove();
  }
}
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.detail===0||event.target.closest('#petals'))return;
  throwFlowers(event.clientX,event.clientY);
});

const countdown=document.querySelector('.count');
const weddingDay=new Date(2027,10,11);
const followingDay=new Date(2027,10,12);
const counters=['days','hours','minutes','seconds'].map(id=>document.getElementById(id));
function updateCountdown(){
  const now=new Date();
  if(now>=weddingDay){
    countdown.classList.add('count-ended');
    countdown.textContent=now<followingDay?'Today is the wedding day!':'Thank you for celebrating with us.';
    return;
  }
  const remaining=Math.floor((weddingDay-now)/1000);
  const values=[Math.floor(remaining/86400),Math.floor(remaining/3600)%24,Math.floor(remaining/60)%60,remaining%60];
  counters.forEach((counter,index)=>counter.textContent=String(values[index]).padStart(index?2:1,'0'));
}
updateCountdown();
setInterval(updateCountdown,1000);
document.querySelector('#share').addEventListener('click',async()=>{
  const url=new URL(location.href);
  url.hash='';
  if(location.protocol==='file:'){
    document.querySelector('#feedback').textContent='Open the published invitation to share its link.';
    return;
  }
  try{
    if(navigator.share) await navigator.share({title:'Anamika & Priyam · Wedding Invitation',url:url.href});
    else{
      await navigator.clipboard.writeText(url.href);
      document.querySelector('#feedback').textContent='Invitation link copied.';
    }
  }catch(error){
    if(error.name!=='AbortError') document.querySelector('#feedback').textContent='You can share the invitation using the address in your browser.';
  }
});
const eventLines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wedding Invitation//Anamika and Priyam//EN','BEGIN:VEVENT','UID:anamika-priyam-wedding-20271111@invitation','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),'DTSTART;VALUE=DATE:20271111','DTEND;VALUE=DATE:20271112','SUMMARY:Anamika and Priyam’s wedding','END:VEVENT','END:VCALENDAR',''];
document.querySelector('#calendar').href=URL.createObjectURL(new Blob([eventLines.join('\r\n')],{type:'text/calendar;charset=utf-8'}));
document.querySelector('#petals').addEventListener('click',()=>{
  const feedback=document.querySelector('#feedback');
  feedback.textContent='With love and blessings!';
  const bounds=document.querySelector('#petals').getBoundingClientRect();
  throwFlowers(bounds.x+bounds.width/2,bounds.y+bounds.height/2,42);
});
