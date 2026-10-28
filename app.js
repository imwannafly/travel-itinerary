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

// ===== WEATHER WIDGET =====
(() => {
  const grid = document.getElementById('weather-grid');
  const updated = document.getElementById('weather-updated');
  const refresh = document.getElementById('weather-refresh');

  // 위젯 HTML이 없으면 실행하지 않음
  if (!grid || !updated || !refresh) return;

  const days = [
    { date: '2026-11-01', label: '11월 1일', place: '가와구치코', region: 'fuji' },
    { date: '2026-11-02', label: '11월 2일', place: '후지산 주변', region: 'fuji' },
    { date: '2026-11-03', label: '11월 3일', place: '도쿄', region: 'tokyo' },
    { date: '2026-11-04', label: '11월 4일', place: '도쿄', region: 'tokyo' },
    { date: '2026-11-05', label: '11월 5일', place: '도쿄', region: 'tokyo' }
  ];

  const locations = {
    fuji: { latitude: 35.517, longitude: 138.751 },
    tokyo: { latitude: 35.6762, longitude: 139.6503 }
  };

  function weatherInfo(code) {
    if (code === 0) return ['☀️', '맑음'];
    if (code === 1) return ['🌤️', '대체로 맑음'];
    if (code === 2) return ['⛅', '구름 조금'];
    if (code === 3) return ['☁️', '흐림'];
    if ([45, 48].includes(code)) return ['🌫️', '안개'];
    if ([51, 53, 55, 56, 57].includes(code)) return ['🌦️', '이슬비'];
    if ([61, 63, 65, 66, 67].includes(code)) return ['🌧️', '비'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['❄️', '눈'];
    if ([80, 81, 82].includes(code)) return ['🌧️', '소나기'];
    if ([95, 96, 99].includes(code)) return ['⛈️', '뇌우'];
    return ['🌡️', '날씨 정보'];
  }

  function showMessage(message) {
    grid.replaceChildren();
    const p = document.createElement('p');
    p.textContent = message;
    grid.appendChild(p);
  }

  async function getForecast(region) {
    const location = locations[region];

    const params = new URLSearchParams({
      latitude: location.latitude,
      longitude: location.longitude,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      start_date: '2026-11-01',
      end_date: '2026-11-05',
      timezone: 'Asia/Tokyo'
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`,
        { signal: controller.signal, cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.daily || !Array.isArray(data.daily.time)) {
        throw new Error('예보 데이터가 올바르지 않습니다.');
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  function makeCard(day, forecast) {
    const card = document.createElement('article');
    card.className = 'weather-card';

    function add(className, text) {
      const el = document.createElement('div');
      el.className = className;
      el.textContent = text;
      card.appendChild(el);
      return el;
    }

    add('weather-date', day.label);
    add('weather-place', day.place);

    const index = forecast.daily.time.indexOf(day.date);

    if (index === -1) {
      add('weather-condition', '예보 없음');
      add('weather-status', '현재 예보 범위 밖이거나 자료가 없어요.');
      return card;
    }

    const code = forecast.daily.weather_code[index];
    const [icon, condition] = weatherInfo(code);

    add('weather-icon', icon);
    add('weather-condition', condition);

    const max = forecast.daily.temperature_2m_max[index];
    const min = forecast.daily.temperature_2m_min[index];

    if (Number.isFinite(max) && Number.isFinite(min)) {
      add('weather-temp', `${Math.round(max)}° / ${Math.round(min)}°`);
    } else {
      add('weather-temp', '기온 정보 없음');
    }

    const rain = forecast.daily.precipitation_probability_max?.[index];

    add(
      'weather-rain',
      rain == null ? '강수 확률 정보 없음' : `강수 확률 ${rain}%`
    );

    return card;
  }

  async function loadWeather() {
    refresh.disabled = true;
    refresh.textContent = '불러오는 중...';
    updated.textContent = '최신 예보를 확인하고 있어요.';
    showMessage('날씨 정보를 불러오는 중이에요 ☁️');

    try {
      const [fuji, tokyo] = await Promise.all([
        getForecast('fuji'),
        getForecast('tokyo')
      ]);

      grid.replaceChildren();

      days.forEach(day => {
        const forecast = day.region === 'fuji' ? fuji : tokyo;
        grid.appendChild(makeCard(day, forecast));
      });

      const time = new Date().toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit'
      });

      updated.textContent = `마지막 확인: ${time} (일본 시간)`;
    } catch (error) {
      console.error('날씨 위젯 오류:', error);

      showMessage(
        error.name === 'AbortError'
          ? '날씨 요청 시간이 초과됐어요. 새로고침을 눌러 주세요.'
          : '날씨를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
      );

      updated.textContent = '날씨 정보를 확인할 수 없어요.';
    } finally {
      refresh.disabled = false;
      refresh.textContent = '새로고침 ↻';
    }
  }

  refresh.addEventListener('click', loadWeather);
  loadWeather();

  // 30분마다 예보 갱신
  setInterval(loadWeather, 30 * 60 * 1000);
})();
