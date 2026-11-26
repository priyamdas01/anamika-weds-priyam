import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,realpath,stat} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=dirname(fileURLToPath(import.meta.url));
const publicRoot=await realpath(resolve(directory,'../dist'));
const password=process.env.RSVP_ADMIN_PASSWORD;
if(!password||password.length<16)throw Error('Set RSVP_ADMIN_PASSWORD to at least 16 characters.');
const storage=resolve(process.env.RSVP_DATA_DIR||resolve(directory,'data'));
await mkdir(storage,{recursive:true});
const privateRoot=await realpath(storage);
if(privateRoot===publicRoot||privateRoot.startsWith(publicRoot+sep))throw Error('RSVP data must live outside dist.');
const db=new DatabaseSync(resolve(privateRoot,'rsvp.sqlite'));
db.exec("CREATE TABLE IF NOT EXISTS invitations(id INTEGER PRIMARY KEY, token TEXT NOT NULL UNIQUE, name TEXT NOT NULL, seats INTEGER NOT NULL CHECK(seats BETWEEN 1 AND 100), attendance INTEGER, guests INTEGER, updated TEXT, CHECK((attendance IS NULL AND guests IS NULL) OR (attendance=0 AND guests=0) OR (attendance=1 AND guests BETWEEN 1 AND seats)))");
const find=db.prepare('SELECT name,seats,attendance,guests FROM invitations WHERE token=?');
const save=db.prepare('UPDATE invitations SET attendance=?,guests=?,updated=? WHERE token=? AND seats>=?');
const add=db.prepare('INSERT INTO invitations(token,name,seats) VALUES(?,?,?)');
const all=db.prepare('SELECT name,seats,attendance,guests,updated FROM invitations ORDER BY name,id');
const hash=value=>createHash('sha256').update(value).digest('hex');
const adminSecret=Buffer.from(hash('admin:'+password));
function authenticated(req){
  const authorization=req.headers.authorization||'';
  return authorization.startsWith('Basic ') && timingSafeEqual(adminSecret,Buffer.from(hash(Buffer.from(authorization.slice(6),'base64'))));
}
function reply(res,status,data){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
async function readBody(req){
  if(req.headers['content-type']?.split(';')[0]!=='application/json')return null;
  let raw='';
  try{
    for await(const chunk of req){raw+=chunk;if(raw.length>4096)return null;}
    const value=JSON.parse(raw);
    return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
  }catch{return null;}
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.mp3':'audio/mpeg'};
async function file(req,res,path){
  if(!['GET','HEAD'].includes(req.method))return reply(res,405,{error:'Method unavailable.'});
  const resolved=await realpath(path).catch(()=>null);
  const info=resolved&&await stat(resolved).catch(()=>null);
  if(!info?.isFile())return reply(res,404,{error:'Not found.'});
  res.writeHead(200,{'Content-Type':mime[extname(resolved)],'Content-Length':info.size});
  if(req.method==='HEAD')return res.end();
  createReadStream(resolved).on('error',()=>res.destroy()).pipe(res);
}
const server=createServer(async(req,res)=>{
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/admin'||pathname==='/api/admin/invites'){
      res.setHeader('Cache-Control','no-store');
      if(!authenticated(req)){
        res.setHeader('WWW-Authenticate','Basic realm="Wedding RSVP", charset="UTF-8"');
        return reply(res,401,{error:'Administrator sign-in required.'});
      }
      if(pathname==='/admin')return await file(req,res,resolve(directory,'admin.html'));
      if(req.method==='GET'){
        const invites=all.all();
        const totals={invited:invites.length,responded:0,coming:0,declined:0};
        for(const invite of invites){
          if(invite.attendance!==null)totals.responded++;
          if(invite.attendance===1)totals.coming+=invite.guests;
          if(invite.attendance===0)totals.declined++;
        }
        return reply(res,200,{invites,totals});
      }
      if(req.method==='POST'){
        const data=await readBody(req);
        const name=typeof data?.name==='string'?data.name.trim():'';
        if(!name||name.length>120||!Number.isInteger(data.seats)||data.seats<1||data.seats>100)
          return reply(res,400,{error:'Enter a name and a seat limit from 1 to 100.'});
        const token=randomBytes(32).toString('base64url');
        add.run(hash(token),name,data.seats);
        return reply(res,201,{link:'/#rsvp='+token});
      }
      return reply(res,405,{error:'Method unavailable.'});
    }
    if(pathname==='/api/rsvp'){
      const token=req.headers['x-invitation-token'];
      if(typeof token!=='string'||!/^[-_A-Za-z0-9]{43}$/.test(token))return reply(res,404,{error:'This invitation link is invalid.'});
      const key=hash(token);
      const invite=find.get(key);
      if(!invite)return reply(res,404,{error:'This invitation link is invalid.'});
      if(req.method==='GET')return reply(res,200,invite);
      if(req.method!=='POST')return reply(res,405,{error:'Method unavailable.'});
      const data=await readBody(req);
      if(typeof data?.attending!=='boolean'||!Number.isInteger(data.guests)||(data.attending?data.guests<1:data.guests!==0))
        return reply(res,400,{error:'Choose a valid attendance response.'});
      if(!save.run(Number(data.attending),data.guests,new Date().toISOString(),key,data.guests).changes)
        return reply(res,400,{error:'That exceeds your invitation’s guest limit.'});
      return reply(res,200,find.get(key));
    }
    const name=pathname==='/'?'index.html':decodeURIComponent(pathname).slice(1);
    const candidate=resolve(publicRoot,name);
    const physical=await realpath(candidate).catch(()=>null);
    if(!candidate.startsWith(publicRoot+sep)||!physical?.startsWith(publicRoot+sep)||!mime[extname(physical)]||name.split(/[\\/]/).some(part=>part.startsWith('.')))
      return reply(res,404,{error:'Not found.'});
    return await file(req,res,physical);
  }catch{
    if(!res.headersSent)reply(res,500,{error:'Something went wrong.'});else res.destroy();
  }
});
server.listen(Number(process.env.PORT||8787),'127.0.0.1',()=>process.send?.(server.address().port));