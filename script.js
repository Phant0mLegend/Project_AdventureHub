// Глобальные переменные
let map;
let currentLayer;

// Исправленные подложки
const layers = {
  // --- ОСНОВНЫЕ ПОДЛОЖКИ ---
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

  // --- STRAVA HEATMAP ---
  strava: L.tileLayer('https://tiles.stadiamaps.com/tiles/strava_segment/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.strava.com">Strava</a>'
  }),

  // --- СОВЕТСКИЕ ТОПОКАРТЫ (OpenTopoMap + российские аналоги) ---
  topo250: L.tileLayer('https://opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>'
  }),

  // Для 1:500k и 1:1M — используем единый стиль (подходит под "советские")
  topo500: L.tileLayer('https://tile.nextzen.org/tilezen/vector/v1/512/all/{z}/{x}/{y}.topo.json', {
    format: 'topojson',
    maxZoom: 14,
    style: () => ({ color: '#555' }),
    attribution: 'Nextzen'
  }),

  // --- ГЕОЛОГИЧЕСКИЙ СЛОН ---
  geology: L.tileLayer('https://gscloud.ru/api/maps/geology/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: 'Геологическая карта © <a href="https://gscloud.ru">ГСК</a>'
  }),

  // --- ОПАСНЫЕ ЗОНЫ (лавины, обвалы) — условный слой (можно заменить на GeoJSON)
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

  // Стартовая подложка
  currentLayer = layers.openstreetmap;
  currentLayer.addTo(map);
}

// Смена слоя
function setBaseLayer(key) {
  const newLayer = layers[key];
  if (newLayer && currentLayer !== newLayer) {
    map.removeLayer(currentLayer);
    currentLayer = newLayer;
    currentLayer.addTo(map);
  }
}

// Загрузка GPX-файла
async function loadGPX() {
  try {
    const response = await fetch('data/route.gpx');
    const text = await response.text();
    parseGPX(text);
  } catch (e) {
    console.warn("GPX не загружен (возможно, файл отсутствует):", e.message);
  }
}

// Парсинг GPX
function parseGPX(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "text/xml");
  const trackSegments = xmlDoc.querySelectorAll("trk > trkseg");

  trackSegments.forEach(seg => {
    const points = [];
    seg.querySelectorAll("trkpt").forEach(pt => {
      const lat = parseFloat(pt.getAttribute("lat"));
      const lon = parseFloat(pt.getAttribute("lon"));
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push([lat, lon]);
      }
    });
    if (points.length > 0) {
      L.polyline(points, {
        color: '#FF5722',
        weight: 5,
        opacity: 0.8
      }).addTo(map);
    }
  });

  // Центрируем карту по маршруту
  if (trackSegments.length > 0) {
    const firstPt = trackSegments[0].querySelector("trkpt");
    if (firstPt) {
      const lat = parseFloat(firstPt.getAttribute("lat"));
      const lon = parseFloat(firstPt.getAttribute("lon"));
      map.setView([lat, lon], 10);
    }
  }
}

// Импорт GPX/KML
function importRoute() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  if (!file) return alert("Выберите файл .gpx или .kml");

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    if (file.name.endsWith('.gpx')) {
      parseGPX(text);
    } else {
      alert("KML пока не поддерживается в браузере напрямую. Используйте GPX.");
    }
  };
  reader.readAsText(file);
}

// Запуск при загрузке
window.addEventListener('load', () => {
  if (document.getElementById('map')) {
    initMap();     // Создаём карту
    loadGPX();      // Загружаем маршрут
  }
});
