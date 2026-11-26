const status=document.querySelector('[role=status]');
async function refresh(){
  const response=await fetch('/api/admin/invites');
  if(!response.ok)throw Error('Could not load responses.');
  const {invites,totals}=await response.json();
  document.querySelector('#totals').textContent=totals.responded+' of '+totals.invited+' parties responded · '+totals.coming+' guests coming · '+totals.declined+' declined';
  const table=document.querySelector('tbody');
  table.replaceChildren();
  for(const invite of invites){
    const row=table.insertRow();
    for(const value of [invite.name,invite.seats,invite.attendance===null?'Pending':invite.attendance?'Attending':'Declined',invite.guests??'—'])row.insertCell().textContent=value;
  }
}
document.querySelector('form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const button=form.querySelector('button');
  const data=new FormData(form);
  button.disabled=true;
  try{
    const response=await fetch('/api/admin/invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:data.get('name'),seats:Number(data.get('seats'))})});
    const result=await response.json();
    if(!response.ok)throw Error(result.error);
    document.querySelector('#link-label').hidden=false;
    const link=document.querySelector('#new-link');
    link.value=new URL(result.link,location.origin).href;
    link.select();
    form.reset();
    status.textContent='Invitation link created. Copy it before creating another.';
    await refresh();
  }catch(error){status.textContent=error.message;}
  finally{button.disabled=false;}
});
refresh().catch(error=>{status.textContent=error.message;});