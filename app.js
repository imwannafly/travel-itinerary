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
```javascript
// ===== TRAVEL WEATHER WIDGET =====
(() => {
  const weatherGrid = document.getElementById('weather-grid');
  const updatedLabel = document.getElementById('weather-updated');
  const refreshButton = document.getElementById('weather-refresh');

  // 여행 날짜와 위치
  const travelDays = [
    { date: '2026-11-01', label: '11월 1일', place: '가와구치코', lat: 35.517, lon: 138.751 },
    { date: '2026-11-02', label: '11월 2일', place: '후지산 주변', lat: 35.517, lon: 138.751 },
    { date: '2026-11-03', label: '11월 3일', place: '도쿄', lat: 35.6762, lon: 139.6503 },
    { date: '2026-11-04', label: '11월 4일', place: '도쿄', lat: 35.6762, lon: 139.6503 },
    { date: '2026-11-05', label: '11월 5일', place: '도쿄', lat: 35.6762, lon: 139.6503 }
  ];

  // WMO 날씨 코드 → 아이콘과 설명
  function describeWeather(code) {
    if (code === 0) return ['☀️', '맑음'];
    if (code === 1) return ['🌤️', '대체로 맑음'];
    if (code === 2) return ['⛅', '구름 조금'];
    if (code === 3) return ['☁️', '흐림'];
    if ([45, 48].includes(code)) return ['🌫️', '안개'];
    if ([51, 53, 55, 56, 57].includes(code)) return ['🌦️', '이슬비'];
    if ([61, 63, 65, 66, 67].includes(code)) return ['🌧️', '비'];
    if ([71, 73, 75, 77].includes(code)) return ['❄️', '눈'];
    if ([80, 81, 82].includes(code)) return ['🌧️', '소나기'];
    if ([85, 86].includes(code)) return ['🌨️', '눈 소나기'];
    if ([95, 96, 99].includes(code)) return ['⛈️', '뇌우'];
    return ['🌡️', '날씨 정보'];
  }

  function showMessage(message) {
    weatherGrid.replaceChildren();
    const p = document.createElement('p');
    p.textContent = message;
    weatherGrid.appendChild(p);
  }

  async function fetchForecast(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      start_date: '2026-11-01',
      end_date: '2026-11-05',
      timezone: 'Asia/Tokyo'
    });

  const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

let response;

try {
  response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    {
      cache: 'no-store',
      signal: controller.signal
    }
  );
} finally {
  clearTimeout(timeout);
}

    if (!response.ok) {
      throw new Error('날씨 API 응답 오류');
    }

    return response.json();
  }

  async function loadWeather() {
    refreshButton.disabled = true;
    refreshButton.textContent = '불러오는 중...';
    updatedLabel.textContent = '최신 예보를 확인하고 있어요.';
    showMessage('날씨 정보를 불러오는 중이에요 ☁️');

    try {
      // 두 지역의 예보를 각각 요청
      const [fuji, tokyo] = await Promise.all([
        fetchForecast(35.517, 138.751),
        fetchForecast(35.6762, 139.6503)
      ]);

      const forecasts = {};

      [fuji, tokyo].forEach(data => {
        data.daily.time.forEach((date, i) => {
          forecasts[`${data.latitude},${date}`] = {
            code: data.daily.weather_code[i],
            max: data.daily.temperature_2m_max[i],
            min: data.daily.temperature_2m_min[i],
            rain: data.daily.precipitation_probability_max?.[i]
          };
        });
      });

      weatherGrid.replaceChildren();

      travelDays.forEach(day => {
        const region = day.lat === 35.517 ? fuji : tokyo;
        const index = region.daily.time.indexOf(day.date);
        const card = document.createElement('article');
        card.className = 'weather-card';

        const date = document.createElement('div');
        date.className = 'weather-date';
        date.textContent = day.label;
        card.appendChild(date);

        const place = document.createElement('div');
        place.className = 'weather-place';
        place.textContent = day.place;
        card.appendChild(place);

        if (index === -1) {
          const status = document.createElement('div');
          status.className = 'weather-status';
          status.textContent = '아직 예보가 제공되지 않아요.';
          card.appendChild(status);
          weatherGrid.appendChild(card);
          return;
        }

        const code = region.daily.weather_code[index];
        const [icon, condition] = describeWeather(code);

        const iconEl = document.createElement('div');
        iconEl.className = 'weather-icon';
        iconEl.textContent = icon;
        card.appendChild(iconEl);

        const conditionEl = document.createElement('div');
        conditionEl.className = 'weather-condition';
        conditionEl.textContent = condition;
        card.appendChild(conditionEl);

        const max = region.daily.temperature_2m_max[index];
        const min = region.daily.temperature_2m_min[index];
        const temp = document.createElement('div');
        temp.className = 'weather-temp';
        temp.textContent =
          Number.isFinite(max) && Number.isFinite(min)
            ? `${Math.round(max)}° / ${Math.round(min)}°`
            : '기온 정보 없음';
        card.appendChild(temp);

        const rain = region.daily.precipitation_probability_max?.[index];
        const rainEl = document.createElement('div');
        rainEl.className = 'weather-rain';
        rainEl.textContent =
          rain != null ? `강수 확률 ${rain}%` : '강수 확률 정보 없음';
        card.appendChild(rainEl);

        weatherGrid.appendChild(card);
      });

      const now = new Date();
      updatedLabel.textContent =
        `마지막 확인: ${now.toLocaleTimeString('ko-KR', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit'
        })} (일본 시간)`;
    } catch (error) {
      console.error('날씨 정보를 불러오지 못했습니다:', error);
      showMessage('날씨 정보를 불러오지 못했어요. 잠시 후 새로고침해 주세요.');
      updatedLabel.textContent = '날씨 정보를 확인할 수 없어요.';
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = '새로고침 ↻';
    }
  }

  refreshButton.addEventListener('click', loadWeather);
  loadWeather();

  // 30분마다 자동으로 예보 갱신
  window.setInterval(loadWeather, 30 * 60 * 1000);
})();
```
