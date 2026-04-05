// Глобальные переменные
let map;
let currentLayer;
let overlayLayers = {};

// === СЛОИ КАРТЫ ===
const layers = {
  // Основные подложки
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

  // Strava Heatmap
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

  // Меню слоёв — теперь 100% работает
  const btn = document.getElementById('layers-btn');
  const panel = document.getElementById('layers-panel');

  if (btn && panel) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      panel.classList.toggle('active');
    });

    // Закрытие при клике вне панели
    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && event.target !== btn) {
        panel.classList.remove('active');
      }
    });
  }

  // Загружаем сегменты
  loadSegments();
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

// === ЗАГРУЗКА СЕГМЕНТОВ ПО ДНЯМ ===
async function loadSegment(day, color, name) {
  try {
    const res = await fetch(`data/day${day}.gpx`);
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
      // Линия маршрута
      L.polyline(points, { color, weight: 5, opacity: 0.8 }).addTo(map)
        .bindPopup(`<b>День ${day}</b><br>Протяжённость: ~12–18 км`);

      // Точки: старт и финиш
      L.marker(points[0]).addTo(map).bindPopup(`<b>День ${day} старт</b>`);
      L.marker(points[points.length - 1]).addTo(map).bindPopup(`<b>День ${day} финиш</b>`);
    }
  } catch (e) {
    console.warn(`День ${day} не загружен:`, e.message);
  }
}

// Загрузка всех сегментов
function loadSegments() {
  const colors = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#795548', '#607D8B', '#3F51B5'];

  for (let i = 1; i <= 10; i++) {
    loadSegment(i, colors[(i - 1) % colors.length], `День ${i}`);
  }
}

// УБРАЛИ importRoute() — больше не нужна
// УБРАЛИ кнопку "Импортировать GPX" из route.html

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    initMap();
  }
});
