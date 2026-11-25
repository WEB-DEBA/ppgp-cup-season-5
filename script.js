const ROLES=["Opening Batsman","Middle Order Batsman","Fast Bowler","Medium Fast Bowler","Batting All Rounder","Bowling All Rounder","Off Spinner","Leg Spinner"];
const CATS=ROLES.concat(["Wicket Keeper"]);
const DECL=["I am willing to participate in the PPGP Cup.","I agree to obey the rules and regulations of the tournament and to play with true sportsmanship.","I am aware that if I violate any condition, I may be de-registered.","The information given is true and legal."];
let rows=[],db=null,uid=null,isAdmin=false,downloads=null,filter="All",q="",localMode=false;
const $=id=>document.getElementById(id);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in(attrs||{})){if(k==="class")e.className=attrs[k];else if(k.startsWith("on"))e[k]=attrs[k];else e.setAttribute(k,attrs[k])}kids.flat().forEach(c=>e.append(c instanceof Node?c:document.createTextNode(c)));return e}
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

/* ---- storage: records are only ever added, never deleted or changed ---- */
async function initStore(){
  try{
    const user=await claude.use("user");db=await claude.use("db");downloads=await claude.use("downloads");
    if(user){uid=await user.id();isAdmin=(await user.canEdit())||(await user.isOwner())}
  }catch(e){db=null}
  if(!db){localMode=true;return}
  if(isAdmin){
    $("nav").classList.remove("hide");
    db.collection("registrations").onSnapshot(s=>{rows=[];s.docs.forEach(d=>{const o=d.data();for(const k in o)if(o[k]&&typeof o[k]==="object")rows.push(Object.assign({id:k},o[k]))});rows.sort((a,b)=>(a.created||0)-(b.created||0));$("cnt").textContent=rows.length;if(!$("vAdm").classList.contains("hide"))buildAdm()},()=>{});
  }
}
async function save(rec){
  const id="p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  rec.created=Date.now();
  if(db){
    if(!uid)throw new Error("signin");
    const ref=db.doc("registrations/"+uid);let cur={};
    try{const sn=await ref.get();if(sn.exists)cur=sn.data()}catch(e){}
    cur[id]=rec;await ref.set(cur);
  }else{const a=lsGet("ppgp5-reg")||[];a.push(Object.assign({id},rec));lsSet("ppgp5-reg",a)}
}

/* ---- form ---- */
let S={bat:"",bowl:"",wk:"",roles:new Set()};
function chipGroup(key,opts){
  const box=h("div",{class:"chips"});
  opts.forEach(o=>{const b=h("button",{type:"button",class:"chip","aria-pressed":"false"},o);
    b.onclick=()=>{S[key]=o;[...box.children].forEach(c=>c.setAttribute("aria-pressed",c===b))};box.append(b)});
  return box;
}
function buildForm(){
  const v=$("vReg");v.textContent="";
  S={bat:"",bowl:"",wk:"",roles:new Set()};
  const name=h("input",{type:"text",autocomplete:"name",placeholder:"Full name"});
  const nick=h("input",{type:"text",placeholder:"Nick name (optional)"});
  const dob=h("input",{type:"date"});
  const age=h("input",{type:"text",readonly:"",placeholder:"Auto"});
  dob.onchange=()=>{const d=new Date(dob.value);if(isNaN(d)){age.value="";return}const n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;age.value=a>=0?a:""};
  const aad=h("input",{type:"tel",maxlength:"12",inputmode:"numeric",placeholder:"12-digit Aadhaar"});
  const mob=h("input",{type:"tel",maxlength:"10",inputmode:"numeric",placeholder:"10-digit mobile"});
  [aad,mob].forEach(i=>i.oninput=()=>i.value=i.value.replace(/\D/g,""));
  const ach=h("textarea",{rows:"3",placeholder:"Achievements and representation, if any (optional)"});
  const sign=h("input",{type:"text",placeholder:"Type your full name as signature"});
  const today=new Date().toLocaleDateString("en-GB");
  const agree=h("input",{type:"checkbox"});
  const roleBox=h("div",{class:"chips"});
  ROLES.forEach(r=>{const b=h("button",{type:"button",class:"chip","aria-pressed":"false"},r);
    b.onclick=()=>{S.roles.has(r)?S.roles.delete(r):S.roles.add(r);b.setAttribute("aria-pressed",S.roles.has(r))};roleBox.append(b)});
  const err=h("div",{class:"err",role:"alert"});
  const btn=h("button",{type:"button",class:"submit"},"Register for PPGP Cup Season 5");
  btn.onclick=async()=>{
    const e=[];
    if(name.value.trim().length<3)e.push("Enter your full name.");
    if(!dob.value||age.value==="")e.push("Select a valid date of birth.");
    if(!/^\d{12}$/.test(aad.value))e.push("Aadhaar number must be 12 digits.");
    if(!/^[6-9]\d{9}$/.test(mob.value))e.push("Enter a valid 10-digit mobile number.");
    if(!S.bat)e.push("Select batting hand.");
    if(!S.bowl)e.push("Select bowling arm.");
    if(!S.wk)e.push("Select wicket keeper: Yes or No.");
    if(!S.roles.size)e.push("Select at least one playing role.");
    if(sign.value.trim().length<3)e.push("Type your signature.");
    if(!agree.checked)e.push("Please accept the declarations.");
    err.textContent=e.join(" ");
    if(e.length){err.scrollIntoView({block:"center",behavior:"smooth"});return}
    btn.disabled=true;btn.textContent="Saving…";
    const nm=name.value.trim();
    try{
      await save({name:nm,nick:nick.value.trim(),dob:dob.value,age:+age.value,aadhaar:aad.value,mobile:mob.value,bat:S.bat,bowl:S.bowl,wk:S.wk==="Yes",roles:[...S.roles],ach:ach.value.trim(),signature:sign.value.trim(),date:today});
      v.textContent="";
      v.append(h("div",{class:"done"},h("h2",{},"✅ Registration Successful"),h("p",{},nm+", you are registered for PPGP Cup Season 5. Good luck!"),
        h("button",{type:"button",class:"btn",onclick:buildForm},"Register another player")));
      scrollTo(0,0);
    }catch(x){err.textContent="Could not save. Please make sure you are signed in to Claude with contributor access, then try again.";btn.disabled=false;btn.textContent="Register for PPGP Cup Season 5"}
  };
  v.append(
    h("div",{class:"sec"},h("h2",{},"🏏 Player Details"),h("div",{class:"grid"},
      h("label",{class:"f"},"Full name",name),h("label",{class:"f"},"Nick name (optional)",nick),h("label",{class:"f"},"DOB",dob),h("label",{class:"f"},"Age",age),
      h("label",{class:"f"},"Aadhaar no",aad),h("label",{class:"f"},"Mobile no",mob))),
    h("div",{class:"sec"},h("h2",{},"Classification"),
      h("div",{class:"row"},h("b",{},"(a) Batting"),chipGroup("bat",["Right Hand Bat","Left Hand Bat"])),
      h("div",{class:"row"},h("b",{},"(b) Bowling"),chipGroup("bowl",["Right Arm","Left Arm"])),
      h("div",{class:"row"},h("b",{},"(c) Wicket Keeper"),chipGroup("wk",["Yes","No"]))),
    h("div",{class:"sec"},h("h2",{},"Playing Role (tick as applicable)"),roleBox),
    h("div",{class:"sec"},h("h2",{},"🏆 Achievements and Representation (optional)"),ach),
    h("div",{class:"sec"},h("h2",{},"Declarations"),h("ol",{class:"dec"},DECL.map(d=>h("li",{},d))),
      h("label",{style:"display:flex;gap:8px;margin-top:10px;align-items:center"},agree,"I accept all the declarations above."),
      h("div",{class:"grid",style:"margin-top:10px"},
        h("label",{class:"f"},"Date",h("input",{type:"text",value:today,readonly:""})),
        h("label",{class:"f"},"Signature of the player",sign))),
    err,btn);
}

/* ---- organizer-only view (no delete anywhere) ---- */
function inCat(p,c){return c==="Wicket Keeper"?p.wk:(p.roles||[]).includes(c)}
function card(p){
  const ini=p.name.split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const body=h("div",{class:"pb"},h("div",{class:"pn"},p.name,p.nick?h("span",{class:"nk"},"“"+p.nick+"”"):""),
    h("div",{class:"meta"},h("span",{},"Age "+p.age),h("span",{},"🏏 "+p.bat),h("span",{},"🎯 "+p.bowl+" bowler")));
  if(p.wk)body.append(h("span",{class:"tag wk"},"🧤 Wicket Keeper"));
  (p.roles||[]).forEach(r=>body.append(h("span",{class:"tag"},r)));
  if(p.ach)body.append(h("div",{class:"ac"},"🏆 "+p.ach));
  return h("div",{class:"pl"},h("div",{class:"av"},ini),body,h("div",{class:"adm"},"DOB: "+p.dob+" · Mobile: "+p.mobile+" · Aadhaar: "+p.aadhaar+" · Date: "+p.date));
}
function csvCell(x){return '"'+String(x==null?"":x).replace(/"/g,'""')+'"'}
async function exportCsv(){
  if(!downloads)return;
  const cols=["name","nick","dob","age","aadhaar","mobile","bat","bowl","wk","roles","ach","date"];
  const lines=[cols.join(",")].concat(rows.map(r=>cols.map(c=>csvCell(c==="roles"?(r.roles||[]).join("; "):c==="wk"?(r.wk?"Yes":"No"):c==="aadhaar"||c==="mobile"?"\t"+r[c]:r[c])).join(",")));
  try{await downloads.save({filename:"ppgp-cup-season-5-players.csv",data:"\ufeff"+lines.join("\n")})}catch(e){}
}
function buildAdm(){
  const v=$("vAdm");v.textContent="";
  const chips=h("div",{class:"chips",style:"margin-bottom:12px"});
  ["All"].concat(CATS).forEach(c=>{
    const n=c==="All"?rows.length:rows.filter(p=>inCat(p,c)).length;
    const b=h("button",{type:"button",class:"chip","aria-pressed":String(filter===c)},c+" ("+n+")");
    b.onclick=()=>{filter=c;buildAdm()};chips.append(b)});
  const s=h("input",{type:"text",placeholder:"Search player name",value:q});
  s.oninput=()=>{q=s.value;renderList()};
  const tl=h("div",{class:"tools"},s);
  if(downloads)tl.append(h("button",{type:"button",class:"btn",onclick:exportCsv},"Download CSV"));
  v.append(tl,chips,h("div",{id:"list"}));
  renderList();
}
function renderList(){
  const L=$("list");if(!L)return;L.textContent="";
  const t=q.trim().toLowerCase();
  const m=p=>p.name.toLowerCase().includes(t)||(p.nick||"").toLowerCase().includes(t);
  let shown=0;
  (filter==="All"?CATS:[filter]).forEach(c=>{
    const list=rows.filter(p=>inCat(p,c)&&m(p)).sort((a,b)=>a.name.localeCompare(b.name));
    if(!list.length)return;shown++;
    L.append(h("div",{class:"cat"},h("h3",{},h("span",{},c),h("span",{},list.length)),list.map(card)));
  });
  if(!shown)L.append(h("div",{class:"empty"},rows.length?"No players found.":"No registrations yet."));
}

function show(adm){
  $("vReg").classList.toggle("hide",adm);$("vAdm").classList.toggle("hide",!adm);
  $("nReg").classList.toggle("on",!adm);$("nAdm").classList.toggle("on",adm);
  if(adm)buildAdm();scrollTo(0,0);
}
$("nReg").onclick=()=>show(false);
$("nAdm").onclick=()=>show(true);
buildForm();
initStore();
