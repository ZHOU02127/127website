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
// 使用独立打印窗口，避开 Safari 对 <dialog> 元素打印为空白的兼容问题。
document.querySelector("#print-summary").addEventListener("click",()=>{
  const printWindow=window.open("","_blank","width=820,height=900");
  if(!printWindow){
    alert("Safari 阻止了打印窗口，请允许此网站弹出窗口后重试。");
    return;
  }

  // 页面结构固定，预约内容稍后通过 textContent 写入，避免把用户输入当作 HTML。
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>课程预约信息</title>
  <style>
    @page{size:A4;margin:18mm}
    *{box-sizing:border-box}
    body{margin:0;color:#21172f;background:#fff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif}
    main{max-width:720px;margin:0 auto;border:1px solid #ded4ed;border-radius:22px;padding:38px}
    .mark{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#6e43c7;color:#fff;font:italic 700 24px Georgia,serif}
    .label{margin-top:28px;color:#6e43c7;font-size:11px;font-weight:800;letter-spacing:.15em}
    h1{margin:8px 0 22px;font-size:30px}
    pre{margin:0;padding:22px;border-radius:16px;background:#f4effc;white-space:pre-wrap;font:15px/1.8 -apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif}
    footer{margin-top:24px;color:#71677f;font-size:11px;text-align:center}
  </style>
</head>
<body>
  <main>
    <div class="mark">Z</div>
    <div class="label">BOOKING SUMMARY</div>
    <h1>课程预约信息</h1>
    <pre id="print-content"></pre>
    <footer>高分辅导 · 认真讲题，也认真夸你。</footer>
  </main>
</body>
</html>`);
  printWindow.document.close();
  printWindow.document.querySelector("#print-content").textContent=summary.textContent;

  // 给 Safari 一点渲染时间，再打开系统打印/另存为 PDF 面板。
  window.setTimeout(()=>{
    printWindow.focus();
    printWindow.print();
  },250);
});
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});manager.addEventListener("click",e=>{if(e.target===manager)manager.close()});
renderCalendar();
