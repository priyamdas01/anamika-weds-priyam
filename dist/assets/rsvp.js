const rsvpStatus=document.querySelector('#rsvp-status');
const phoneForm=document.querySelector('#rsvp-phone');
const eventForm=document.querySelector('#rsvp-events');
const token=location.hash.match(/^#rsvp=([-_A-Za-z0-9]{43})$/)?.[1];
let phone;
async function rsvpRequest(body){
  const response=await fetch('/api/event-rsvp',{method:'POST',headers:{'Content-Type':'application/json','X-Invitation-Token':token},body:JSON.stringify(body)});
  const result=await response.json();
  if(!response.ok)throw Error(result.error);
  return result;
}
async function enableRsvp(){
  const response=await fetch('/api/rsvp-availability');
  if(!response.ok)return;
  const configuration=await response.json();
  if(!configuration.available)return;
  rsvpStatus.textContent=token?'Enter the phone number associated with your invitation.':'Open your personal invitation link to RSVP.';
  phoneForm.hidden=!token;
}
phoneForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=phoneForm.querySelector('button');
  button.disabled=true;
  try{
    const value=phoneForm.elements.phone.value.trim();
    const invitation=await rsvpRequest({phone:value});
    phone=value;
    document.querySelector('#rsvp-greeting').textContent='Dear '+invitation.name+', your invitation includes up to '+invitation.seats+' guests per event.';
    const list=document.querySelector('#rsvp-event-list');
    list.replaceChildren();
    for(const item of invitation.events){
      const card=document.createElement('div');
      card.className='rsvp-event';
      const title=document.createElement('h3');
      title.textContent=item.name;
      const details=document.createElement('p');
      const date=new Date(item.date+'T12:00:00Z').toLocaleDateString('en-US',{dateStyle:'long',timeZone:'UTC'});
      details.textContent=date+' · '+item.location;
      const label=document.createElement('label');
      label.textContent='Attendance for '+item.name;
      const select=document.createElement('select');
      select.dataset.event=item.id;
      select.add(new Option('Choose a response',''));
      select.add(new Option('Decline','0'));
      for(let guests=1;guests<=invitation.seats;guests++)select.add(new Option('Attend with '+guests+' total',String(guests)));
      select.value=item.guests===null?'':String(item.guests);
      label.append(select);
      card.append(title,details,label);
      list.append(card);
    }
    rsvpStatus.textContent=invitation.sample?'Preview only. Dates and venues may be sample details.':'Choose your response for each event.';
    phoneForm.hidden=true;
    eventForm.hidden=false;
  }catch(error){rsvpStatus.textContent=error.message;}
  finally{button.disabled=false;}
});
eventForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const responses=[...eventForm.querySelectorAll('select[data-event]')].filter(select=>select.value!=='').map(select=>({id:select.dataset.event,guests:Number(select.value)}));
  if(!responses.length){rsvpStatus.textContent='Choose at least one event response.';return;}
  const button=eventForm.querySelector('button');
  button.disabled=true;
  try{await rsvpRequest({phone,responses});rsvpStatus.textContent='Your event responses have been saved.';}
  catch(error){rsvpStatus.textContent=error.message;}
  finally{button.disabled=false;}
});
enableRsvp().catch(()=>{});