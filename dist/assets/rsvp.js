const invitation=location.hash.match(/^#rsvp=([-_A-Za-z0-9]{43})$/);
if(invitation){
  const section=document.querySelector('#rsvp');
  const form=section.querySelector('form');
  const status=section.querySelector('[role=status]');
  const guests=form.elements.guests;
  const attendance=form.elements.attending;
  const headers={'X-Invitation-Token':invitation[1]};
  section.hidden=false;
  function syncGuests(){guests.disabled=attendance.value!=='yes';guests.required=!guests.disabled;}
  attendance.addEventListener('change',syncGuests);
  async function load(){
    const response=await fetch('/api/rsvp',{headers});
    if(!response.ok)throw Error('This invitation link could not be verified.');
    const invite=await response.json();
    section.querySelector('h2').textContent='Dear '+invite.name;
    section.querySelector('.seat-limit').textContent='Your invitation includes up to '+invite.seats+(invite.seats===1?' guest.':' guests.');
    guests.max=invite.seats;
    guests.value=invite.guests||1;
    attendance.value=invite.attendance===null?'':invite.attendance?'yes':'no';
    syncGuests();
    form.hidden=false;
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const button=form.querySelector('button');
    button.disabled=true;
    const attending=attendance.value==='yes';
    try{
      const response=await fetch('/api/rsvp',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({attending,guests:attending?Number(guests.value):0})});
      const result=await response.json();
      if(!response.ok)throw Error(result.error);
      status.textContent='Your RSVP has been saved.';
    }catch(error){status.textContent=error.message;}
    finally{button.disabled=false;}
  });
  load().catch(error=>{status.textContent=error.message;});
}