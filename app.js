const $=s=>document.querySelector(s); const money=n=>new Intl.NumberFormat('ko-KR').format(n);
$('#trip-title').innerHTML=trip.title.replace(/\n/g,'<br>'); $('#trip-date').textContent=trip.date; $('#trip-subtitle').textContent=trip.subtitle;
$('#intro-title').textContent=trip.introTitle; $('#intro-copy').textContent=trip.introCopy;
const tabs=$('#day-tabs'), schedule=$('#schedule');
function showDay(i){tabs.querySelectorAll('button').forEach((b,n)=>b.classList.toggle('active',n===i));schedule.innerHTML=trip.days[i].items.map(x=>`<article class="schedule-item"><span class="time">${x.time}</span><div class="place">${x.place}<small>${x.note||''}</small></div>${x.url?`<a class="map-link" href="${x.url}" target="_blank" rel="noopener">지도 보기 ↗</a>`:''}</article>`).join('')}
trip.days.forEach((d,i)=>{const b=document.createElement('button');b.textContent=`${d.label} · ${d.date}`;b.onclick=()=>showDay(i);tabs.append(b)});showDay(0);
$('#transport').innerHTML=trip.transport.map(x=>`<div class="info-item"><strong>${x.title}</strong><span>${x.detail.replace(/\n/g,'<br>')}</span>${x.url?`<a class="map-link" href="${x.url}" target="_blank" rel="noopener">지도 보기 ↗</a>`:''}</div>`).join('');
const total=trip.budget.reduce((a,b)=>a+b.amount,0);if($('#budget-total')){$('#budget-total').textContent=`₩${money(total)}`;$('#budget-list').innerHTML=trip.budget.map(x=>`<div class="budget-row"><span>${x.name}</span><strong>₩${money(x.amount)}</strong></div>`).join('');}
const checks=JSON.parse(localStorage.getItem('trip-checks')||'{}');$('#checklist').innerHTML=trip.checklist.map((x,i)=>`<label class="check-item"><input type="checkbox" data-key="${i}" ${checks[i]?'checked':''}><span>${x}</span></label>`).join('');
$('#checklist').onchange=e=>{checks[e.target.dataset.key]=e.target.checked;localStorage.setItem('trip-checks',JSON.stringify(checks))};
