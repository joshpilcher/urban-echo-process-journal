(() => {
"use strict";
const RADIUS = 100;
const STORAGE_KEY = "urban-echo-v1";
const $ = id => document.getElementById(id);
const map = L.map("map", { zoomControl: false }).setView([-26.65, 153.07], 12);
L.control.zoom({position:"bottomleft"}).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);
let position = null, currentAccuracy = null, currentPin = null, accuracyCircle = null, watching = false;
let echoes = readEchoes();
let pins = [];
function readEchoes() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(e => e && typeof e.title === "string" && typeof e.story === "string" && Number.isFinite(e.lat) && Number.isFinite(e.lng)) : [];
  } catch { return []; }
}
function metres(a,b) {
  const rad = Math.PI/180, dlat=(b.lat-a.lat)*rad, dlng=(b.lng-a.lng)*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function distanceLabel(m) { return m < 1000 ? Math.round(m)+" m" : (m/1000).toFixed(1)+" km"; }
function node(type, className, value) {
  const el = document.createElement(type); if(className) el.className=className;
  if(value != null) el.textContent=value; return el;
}
function canCreate() { return !!position && Number.isFinite(currentAccuracy) && currentAccuracy <= RADIUS; }
function render() {
  pins.forEach(pin => map.removeLayer(pin)); pins = [];
  $("echo-count").textContent = String(echoes.length);
  $("echo-list").replaceChildren();
  const records = echoes.map(e=>({...e,distance:position?metres(position,e):null})).sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
  if (!records.length) $("echo-list").append(node("div","empty","No Echoes in this browser yet. Enable GPS and leave the first memory at your location. Saved Echoes remain in this browser only."));
  records.forEach(e=>{
    const within = position && e.distance <= RADIUS;
    const marker = L.marker([e.lat,e.lng],{icon:L.divIcon({className:"",html:'<span class="echo-marker" style="display:block;width:19px;height:19px"></span>',iconSize:[19,19]})}).addTo(map);
    marker.bindTooltip(e.title); pins.push(marker);
    const card=node("button","echo"); card.type="button";
    const top=node("div","echo-top");
    top.append(node("span","echo-tag",within?"● ECHO UNLOCKED":"◇ LOCKED"));
    top.append(node("span","echo-distance",e.distance==null?"GPS required":distanceLabel(e.distance)));
    card.append(top,node("h3","",e.title),node("p","",within?e.story:"Get within 100 metres to reveal this memory."),node("small","",new Date(e.createdAt).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})));
    card.addEventListener("click",()=>{map.flyTo([e.lat,e.lng],16); marker.openTooltip();});
    $("echo-list").append(card);
  });
  $("create").disabled=!canCreate();
  $("create-hint").textContent=!position?"Enable GPS to leave an Echo at your physical location.":!canCreate()?"GPS accuracy is too low for a reliable location. Try moving outside and retrying.":"Ready to leave an Echo at your current GPS position.";
}
function gpsSuccess(result){
  const p={lat:result.coords.latitude,lng:result.coords.longitude}; const first = !position;
  position=p; currentAccuracy=result.coords.accuracy;
  if (currentPin) map.removeLayer(currentPin);
  if (accuracyCircle) map.removeLayer(accuracyCircle);
  currentPin=L.marker([p.lat,p.lng],{icon:L.divIcon({className:"",html:'<span class="user-marker" style="display:block;width:20px;height:20px"></span>',iconSize:[20,20]})}).addTo(map).bindTooltip("Your location");
  accuracyCircle=L.circle([p.lat,p.lng],{radius:currentAccuracy,color:"#4b95e8",weight:1,fillOpacity:.08}).addTo(map);
  $("status-dot").classList.add("online");
  $("location-status").textContent="Your location is active";
  $("location-subtitle").textContent="GPS accuracy ±"+Math.round(currentAccuracy)+" m";
  $("locate").textContent="Recenter";
  if(first) map.setView([p.lat,p.lng],16);
  render();
}
function gpsFailure(err){
  $("status-dot").classList.remove("online");
  $("location-status").textContent="Location unavailable";
  $("location-subtitle").textContent=err.code===1?"Permission denied. Allow location in your browser settings.":"GPS is unavailable. Try outdoors or check device settings.";
  position=null; currentAccuracy=null; render();
}
function locate(){
  if(!navigator.geolocation){$("location-subtitle").textContent="This browser does not support geolocation.";return;}
  if(!window.isSecureContext){$("location-subtitle").textContent="GPS requires HTTPS or localhost.";return;}
  if(watching){if(position)map.flyTo([position.lat,position.lng],16);return;}
  watching=true;
  navigator.geolocation.watchPosition(gpsSuccess,err=>{gpsFailure(err);watching=false;},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
  $("location-status").textContent="Finding your location…";
}
$("locate").addEventListener("click",locate);
$("recenter").addEventListener("click",()=>position?map.flyTo([position.lat,position.lng],16):locate());
$("create").addEventListener("click",()=>{if(canCreate())$("dialog").showModal();});
$("close").addEventListener("click",()=>$("dialog").close());
$("echo-form").addEventListener("submit",event=>{
  event.preventDefault(); $("form-error").textContent="";
  const title=$("title").value.trim(),story=$("story").value.trim();
  if(!canCreate()){ $("form-error").textContent="Accurate GPS is required before saving."; return; }
  if(!title || !story){$("form-error").textContent="Please provide both a title and a memory.";return;}
  const item={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title,story,lat:position.lat,lng:position.lng,createdAt:new Date().toISOString()};
  echoes.unshift(item);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(echoes));}
  catch{echoes.shift();$("form-error").textContent="Browser storage is unavailable or full. Your Echo was not saved.";return;}
  $("echo-form").reset(); $("dialog").close(); render();
});
render();
})();