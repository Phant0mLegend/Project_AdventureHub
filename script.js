// Глобальные переменные
let map;
let currentLayer;
let overlayLayers = {};
let ymap;

// === СЛОИ КАРТЫ ===
const layers = {
  openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }),

  googleSatellite: L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['0','1','2','3'],
    attribution: 'Google Satellite'
  }),

  yandexSatellite: L.tileLayer('https://sat0{s}.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1','2','3','4'],
    attribution: 'Яндекс.Спутник',
    maxZoom: 19
  }),

  strava: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> | DEM: SRTM'
  }),

  topo250: L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© OpenTopoMap'
  }),

  geology: L.tileLayer('https://gsr.gugk.ru/tiles/gkm2500/{z}/{x}/{y}.png', {
    maxZoom: 10,
    minZoom: 4,
    attribution: '© <a href="https://gsr.gugk.ru">ГСР Роскартографии</a>'
  }),

  dangerZones: L.geoJSON(null, {
    style: {
      color: '#ff3300',
      weight: 3,
      opacity: 0.8,
      fillColor: '#ff6600',
      fillOpacity: 0.3
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`<b>⚠️ Опасная зона</b><br>${feature.properties.name || 'Неизвестно'}`);
    }
  })
};

// Инициализация Leaflet
function initMap() {
  map = L.map('map').setView([67.75, 33.54], 10);
  currentLayer = layers.openstreetmap;
  currentLayer.addTo(map);

  // Инициализация оверлеев
  Object.keys(layers).forEach(key => {
    overlayLayers[key] = false;
  });

  // === Создаём кнопку как Leaflet-контрол ===
  const controlButton = L.control({ position: 'topright' });

  controlButton.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-bar');
    div.innerHTML = '<button class="layers-control-button" id="layers-control-btn" title="Меню слоёв">🔧</button>';
    
    // Обработчик клика
    div.firstChild.onclick = () => {
      const panel = document.getElementById('layers-panel');
      panel.classList.toggle('active');
    };

    return div;
  };

  controlButton.addTo(map);

  // Закрытие панели при клике вне
  document.addEventListener('click', (event) => {
    const panel = document.getElementById('layers-panel');
    const btn = document.getElementById('layers-control-btn');
    if (!panel.contains(event.target) && event.target !== btn) {
      panel.classList.remove('active');
    }
  });

  loadSegments();
}


  loadSegments();
}

// Переключение слоёв
function setBaseLayer(key) {
  if (key === 'yandexMap') {
    document.getElementById('map').style.display = 'none';
    document.getElementById('yandex-map').style.display = 'block';
    initYandexMap();
  } else {
    document.getElementById('map').style.display = 'block';
    document.getElementById('yandex-map').style.display = 'none';

    if (layers[key] && currentLayer !== layers[key]) {
      map.removeLayer(currentLayer);
      currentLayer = layers[key];
      currentLayer.addTo(map);
    }
  }
}

// Инициализация Яндекс.Карты
function initYandexMap() {
  if (typeof ymaps !== 'undefined' && !ymap) {
    ymaps.ready(() => {
      ymap = new ymaps.Map('yandex-map', {
        center: [67.75, 33.54],
        zoom: 10,
        controls: []
      });

      // Кнопка масштаба — внизу слева
      ymap.controls.add(new ymaps.control.ZoomControl({
        options: { position: { left: '15px', bottom: '50px' } }
      }));

      // Полноэкранный режим
      ymap.controls.add('fullscreenControl', {
        position: { top: '15px', right: '15px' }
      });

      // Метка старта
      ymap.geoObjects.add(new ymaps.Placemark([67.75, 33.54], {
        hintContent: 'Старт маршрута',
        balloonContent: '<b>Хибины</b><br>День 1: Кировск → Актру'
      }));

      // Загружаем маршрут
      loadYandexRoute();
    }).catch(e => {
      console.error("Ошибка загрузки Яндекс.Карты:", e);
    });
  }
}

// Загрузка маршрута на Яндекс.Карте
async function loadYandexRoute() {
  if (!ymap) return;

  const colors = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#795548', '#607D8B', '#3F51B5'];

  for (let i = 1; i <= 10; i++) {
    try {
      const res = await fetch(`data/day${i}.gpx`);
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
        ymap.geoObjects.add(new ymaps.Polyline(points, {}, {
          strokeColor: colors[(i - 1) % colors.length],
          strokeWidth: 4,
          opacity: 0.8
        }));

        ymap.geoObjects.add(new ymaps.Placemark(points[0], {
          iconCaption: `День ${i} старт`,
          balloonContent: `День ${i}: старт`
        }, {
          preset: 'islands#blueCircleDotIconWithCaption'
        }));

        ymap.geoObjects.add(new ymaps.Placemark(points[points.length - 1], {
          iconCaption: `День ${i} финиш`,
          balloonContent: `День ${i}: финиш`
        }, {
          preset: 'islands#redCircleDotIconWithCaption'
        }));
      }
    } catch (e) {
      console.warn(`День ${i} не загружен на Яндекс`, e.message);
    }
  }
}

// Вкл/выкл оверлеев
function toggleOverlay(key, show) {
  if (show) {
    if (!overlayLayers[key]) {
      if (key === 'dangerZones') {
        loadDangerZones();
      }
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

// Опасные зоны
function loadDangerZones() {
  const data = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": { "name": "Болотистый участок" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[33.54,67.80],[33.58,67.80],[33.58,67.78],[33.54,67.78],[33.54,67.80]]]
      }
    }]
  };
  layers.dangerZones.addData(data);
}

// Загрузка GPX по дням
async function loadSegment(day, color) {
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
      L.polyline(points, { color, weight: 5, opacity: 0.8 }).addTo(map)
        .bindPopup(`<b>День ${day}</b>`);
      L.marker(points[0]).addTo(map).bindPopup(`<b>День ${day} старт</b>`);
      L.marker(points[points.length - 1]).addTo(map).bindPopup(`<b>День ${day} финиш</b>`);
    }
  } catch (e) {
    console.warn(`День ${day} не загружен`, e.message);
  }
}

function loadSegments() {
  const colors = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#795548', '#607D8B', '#3F51B5'];
  for (let i = 1; i <= 10; i++) {
    loadSegment(i, colors[(i - 1) % colors.length]);
  }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    initMap();
  }
});
