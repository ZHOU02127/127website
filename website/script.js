const TIMES=["09:00","10:30","12:00","13:30","15:00","16:30","18:00","19:30"];
let weekOffset=0,managerOffset=0,activeDay=0,chosen="";
const fmt=new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric"});
const weekday=new Intl.DateTimeFormat("zh-CN",{weekday:"short"});
const dayTabs=document.querySelector("#day-tabs"),timeSlots=document.querySelector("#time-slots"),weekTitle=document.querySelector("#week-title"),slotInput=document.querySelector("#slot-input"),selectedSlot=document.querySelector("#selected-slot");
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function mondayFor(offset=0){const d=new Date(),day=d.getDay()||7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day+1+offset*7);return d}
function getDates(offset){const m=mondayFor(offset);return Array.from({length:5},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d})}
function defaultAvailability(){const data={};getDates(0).forEach((d,i)=>data[dateKey(d)]=i%2===0?["10:30","15:00","19:30"]:["09:00","13:30","18:00"]);getDates(1).forEach((d,i)=>data[dateKey(d)]=i<3?["10:30","16:30"]:[]);return data}
function loadAvailability(){try{return JSON.parse(localStorage.getItem("teacherAvailability"))||defaultAvailability()}catch{return defaultAvailability()}}
let availability=loadAvailability();
function saveAvailability(){localStorage.setItem("teacherAvailability",JSON.stringify(availability))}
function renderCalendar(){const dates=getDates(weekOffset);weekTitle.textContent=`${fmt.format(dates[0])} — ${fmt.format(dates[4])}`;dayTabs.innerHTML=dates.map((d,i)=>`<button type="button" class="day-tab ${i===activeDay?'active':''}" role="tab" aria-selected="${i===activeDay}" data-day="${i}">${weekday.format(d)}<b>${d.getDate()}</b></button>`).join("");dayTabs.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{activeDay=Number(btn.dataset.day);chosen="";slotInput.value="";selectedSlot.textContent="请先选择时间";renderCalendar()}));renderTimes(dates[activeDay])}
function renderTimes(date){const slots=availability[dateKey(date)]||[];timeSlots.innerHTML=TIMES.map(t=>{const open=slots.includes(t);return `<button type="button" class="time-slot ${chosen===t?'selected':''}" ${open?'':'disabled'} data-time="${t}">${t}</button>`}).join("");timeSlots.querySelectorAll("button:not(:disabled)").forEach(btn=>btn.addEventListener("click",()=>{chosen=btn.dataset.time;const label=`${fmt.format(date)} ${weekday.format(date)} · ${chosen}`;slotInput.value=label;selectedSlot.textContent=label;selectedSlot.style.color="";renderTimes(date)}))}
document.querySelector("#prev-week").addEventListener("click",()=>{weekOffset--;activeDay=0;chosen="";renderCalendar()});
document.querySelector("#next-week").addEventListener("click",()=>{weekOffset++;activeDay=0;chosen="";renderCalendar()});
const manager=document.querySelector("#manager-dialog"),editor=document.querySelector("#availability-editor"),managerWeek=document.querySelector("#manager-week");
function renderManager(){const dates=getDates(managerOffset);managerWeek.textContent=`${fmt.format(dates[0])} — ${fmt.format(dates[4])}`;editor.innerHTML=dates.map(d=>{const key=dateKey(d),open=availability[key]||[];return `<section class="editor-day" data-date="${key}"><h3>${weekday.format(d)} · ${d.getDate()}日</h3>${TIMES.map(t=>`<button type="button" class="editor-slot ${open.includes(t)?'open':''}" data-time="${t}">${t}</button>`).join("")}</section>`}).join("");editor.querySelectorAll(".editor-slot").forEach(btn=>btn.addEventListener("click",()=>btn.classList.toggle("open")))}
document.querySelector("#open-manager").addEventListener("click",()=>{managerOffset=weekOffset;renderManager();manager.showModal()});
document.querySelector(".manager-close").addEventListener("click",()=>manager.close());
document.querySelector("#manager-prev").addEventListener("click",()=>{managerOffset--;renderManager()});
document.querySelector("#manager-next").addEventListener("click",()=>{managerOffset++;renderManager()});
document.querySelector("#save-availability").addEventListener("click",()=>{editor.querySelectorAll(".editor-day").forEach(day=>{availability[day.dataset.date]=[...day.querySelectorAll(".editor-slot.open")].map(b=>b.dataset.time)});saveAvailability();if(managerOffset===weekOffset){chosen="";slotInput.value="";selectedSlot.textContent="请先选择时间";renderCalendar()}manager.close()});
const menu=document.querySelector(".menu-btn"),links=document.querySelector("#nav-links");menu.addEventListener("click",()=>{const open=links.classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});links.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{links.classList.remove("open");menu.setAttribute("aria-expanded","false")}));
const form=document.querySelector("#booking-form"),dialog=document.querySelector("#success-dialog"),summary=document.querySelector("#booking-summary");
form.addEventListener("submit",e=>{e.preventDefault();if(!slotInput.value){selectedSlot.textContent="请先选择一个可预约时段";selectedSlot.style.color="#c43d67";document.querySelector(".calendar-area").scrollIntoView({behavior:"smooth",block:"center"});return}const data=new FormData(form);const text=`课程预约申请\n\n称呼：${data.get("name")}\n课程：${data.get("course")}\n辅导类型：${data.get("type")}\n预约时间：${data.get("slot")}\n需求备注：${data.get("note")||"暂无"}`;summary.textContent=text;localStorage.setItem("latestBooking",text);dialog.showModal()});
document.querySelector(".dialog-close").addEventListener("click",()=>dialog.close());
document.querySelector("#copy-summary").addEventListener("click",async e=>{await navigator.clipboard.writeText(summary.textContent);e.currentTarget.textContent="已复制 ✓"});
document.querySelector("#print-summary").addEventListener("click",()=>window.print());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});manager.addEventListener("click",e=>{if(e.target===manager)manager.close()});
renderCalendar();
