// Глобальные переменные
let map;
let currentLayer;
let overlayLayers = {};

// === СЛОИ КАРТЫ ===
const layers = {
  // Основные
  openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM'
  }),
  googleSatellite: L.tileLayer('http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    attribution: 'Google'
  }),
  yandexMap: L.tileLayer('https://vec0{s}.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1','2','3','4'],
    attribution: 'Яндекс'
  }),
  yandexSatellite: L.tileLayer('https://sat0{s}.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1','2','3','4'],
    attribution: 'Яндекс'
  }),

  // Strava
  strava: L.tileLayer('https://tiles.stadiamaps.com/tiles/strava_segment/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.strava.com">Strava</a>'
  }),

  // Топокарта 1:250k
  topo250: L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>'
  }),

  // Геология (пример)
  geology: L.tileLayer('https://api.maptiler.com/maps/geology/{z}/{x}/{y}.png?key=YOUR_KEY_HERE', {
    maxZoom: 12,
    attribution: 'Geology © <a href="https://maptiler.com">MapTiler</a>'
  }),

  // Опасные зоны
  dangerZones: L.geoJSON(null, {
    style: {
      color: '#ff3300',
      weight: 2,
      opacity: 0.7,
      fillColor: '#ff6600',
      fillOpacity: 0.3
    }
  })
};

// Инициализация карты
function initMap() {
  map = L.map('map').setView([67.75, 33.54], 10);
  currentLayer = layers.openstreetmap;
  currentLayer.addTo(map);

  // Инициализация оверлеев
  Object.keys(layers).forEach(key => {
    overlayLayers[key] = false;
  });
}

// Смена основного слоя
function setBaseLayer(key) {
  if (layers[key] && currentLayer !== layers[key]) {
    map.removeLayer(currentLayer);
    currentLayer = layers[key];
    currentLayer.addTo(map);
  }
}

// Вкл/выкл оверлеи
function toggleOverlay(key, show) {
  if (show) {
    if (!overlayLayers[key]) {
      map.addLayer(layers[key]);
      overlayLayers[key] = true;
    }
  } else {
    if (overlayLayers[key]) {
      map.removeLayer(layers[key]);
      overlayLayers[key] = false;
    }
  }
}

// Загрузка GPX
async function loadGPX() {
  try {
    const res = await fetch('data/route.gpx');
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const points = [];

    xml.querySelectorAll('trkpt').forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat'));
      const lon = parseFloat(pt.getAttribute('lon'));
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push([lat, lon]);
      }
    });

    if (points.length > 0) {
      L.polyline(points, { color: '#999', weight: 3, opacity: 0.5 }).addTo(map);
    }
  } catch (e) {
    console.warn("GPX не загружен:", e.message);
  }
}

// === СЕГМЕНТЫ МАРШРУТА ===
// ⚠️ ЗАМЕНИ КООРДИНАТЫ НА СВОИ!
function loadSegments() {
  const colors = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63'];
  const segmentNames = [
    'День 1: Старт — редколесье',
    'День 2: Ущелье Аку-Аку',
    'День 3: Водопад Рисйок',
    'День 4: Перевал Чоргорр',
    'День 5: Озеро Академическое',
    'День 6: Тундра и цирки',
    'День 7: Возвращение в Кировск'
  ];

  // 🔽 ЗДЕСЬ ВСТАВЬ СВОИ КООРДИНАТЫ (lat, lon)
  const segments = [
    [[67.825174, 33.53954], [67.803094, 33.596129]], // День 1
    [[67.803094, 33.596129], [67.744922, 33.726463]], // День 2
    [[67.744922, 33.726463], [67.669799, 33.636834]]  // День 3
    // ... добавь остальные
  ];

  segments.forEach((points, i) => {
    if (points.length < 2) return;

    // Линия
    L.polyline(points, {
      color: colors[i % colors.length],
      weight: 5,
      opacity: 0.8
    }).addTo(map).bindPopup(`<b>${segmentNames[i]}</b>`);

    // Точки
    L.marker(points[0]).addTo(map).bindPopup(`<b>День ${i+1} старт</b>`);
    L.marker(points[points.length - 1]).addTo(map).bindPopup(`<b>День ${i+1} финиш</b>`);
  });
}

// Импорт GPX
function importRoute() {
  const file = document.getElementById('import-file').files[0];
  if (!file) return alert('Выберите файл');
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const points = [];
    xml.querySelectorAll('trkpt').forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat'));
      const lon = parseFloat(pt.getAttribute('lon'));
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push([lat, lon]);
      }
    });
    if (points.length > 0) {
      L.polyline(points, { color: '#FF5722', weight: 5 }).addTo(map);
      map.fitBounds(L.polyline(points).getBounds());
    }
  };
  reader.readAsText(file);
}

// Запуск
window.addEventListener('load', () => {
  if (document.getElementById('map')) {
    initMap();
    loadGPX();
    loadSegments(); // ← сегменты загружаются здесь
  }

  // Меню слоёв
  document.getElementById('layers-btn')?.addEventListener('click', () => {
    document.getElementById('layers-panel').classList.toggle('active');
  });
});
