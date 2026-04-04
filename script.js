let map;
let currentLayer;

// Подложки карт
const layers = {
  openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }),
  googleSatellite: L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
    attribution: 'Google Satellite',
    maxZoom: 19
  }),
  yandexMap: L.tileLayer('https://vec0{s}.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1', '2', '3', '4'],
    attribution: 'Данные &copy; <a href="https://yandex.ru">Яндекс</a>',
    maxZoom: 19
  }),
  yandexSatellite: L.tileLayer('https://sat0{s}.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1', '2', '3', '4'],
    attribution: 'Снимки &copy; <a href="https://yandex.ru">Яндекс</a>',
    maxZoom: 19
  })
};

function initMap() {
  map = L.map('map').setView([67.75355, 33.53954], 10);
  currentLayer = layers.openstreetmap;
  currentLayer.addTo(map);
}

function setBaseLayer(key) {
  if (currentLayer) map.removeLayer(currentLayer);
  currentLayer = layers[key];
  currentLayer.addTo(map);
}

// === ЗАГРУЗКА GPX-ТРЕКА ===
async function loadRoute(fileUrl) {
  try {
    const response = await fetch(fileUrl);
    const text = await response.text();
    parseGPX(text);
  } catch (e) {
    alert("Ошибка загрузки маршрута: " + e.message);
  }
}

function parseGPX(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "text/xml");

  // === Линия маршрута ===
  const trackSegments = xmlDoc.querySelectorAll("trk > trkseg");
  const routePoints = [];

  trackSegments.forEach(seg => {
    const points = seg.querySelectorAll("trkpt");
    const segmentLine = [];
    points.forEach(pt => {
      const lat = parseFloat(pt.getAttribute("lat"));
      const lon = parseFloat(pt.getAttribute("lon"));
      segmentLine.push([lat, lon]);
    });
    if (segmentLine.length > 0) {
      routePoints.push(segmentLine);
    }
  });

  // Рисуем маршрут
  routePoints.forEach(line => {
    L.polyline(line, {
      color: '#FF5722',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);
  });

  // === Точки дней ===
  const waypoints = xmlDoc.querySelectorAll("wpt");
  waypoints.forEach(wpt => {
    const lat = parseFloat(wpt.getAttribute("lat"));
    const lon = parseFloat(wpt.getAttribute("lon"));
    const name = wpt.querySelector("name").textContent;

    L.marker([lat, lon], {
      title: name
    }).addTo(map).bindPopup(`
      <b>📅 ${name}</b><br>
      Начало или конец дня.
    `);
  });
}

// Импорт маршрута
function importRoute() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  if (!file) {
    alert("Выберите файл маршрута (.gpx)");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    parseGPX(e.target.result);
  };
  reader.readAsText(file);
}

// Запуск
window.addEventListener('load', () => {
  initMap();
  // Загружаем GPX с сервера (если он лежит в папке data)
  loadRoute('data/route.gpx');
});
