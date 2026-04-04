// Глобальные переменные
let map;
let currentLayer;

// Объект с разными подложками карт
const layers = {
  // 1. OpenStreetMap (стандарт)
  openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }),

  // 2. Google Спутник (через косвенный URL)
  googleSatellite: L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
    attribution: 'Google Satellite',
    maxZoom: 19
  }),

  // 3. Яндекс.Карта (схема)
  yandexMap: L.tileLayer('https://vec0{s}.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1', '2', '3', '4'],
    attribution: 'Данные &copy; <a href="https://yandex.ru">Яндекс</a>',
    maxZoom: 19
  }),

  // 4. Яндекс.Спутник
  yandexSatellite: L.tileLayer('https://sat0{s}.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}&lang=ru_RU', {
    subdomains: ['1', '2', '3', '4'],
    attribution: 'Снимки &copy; <a href="https://yandex.ru">Яндекс</a>',
    maxZoom: 19
  })
};

// Инициализация карты
function initMap() {
  // Начальная точка — Хибины
  map = L.map('map').setView([67.75355, 33.53954], 11);

  // Добавляем слой OSM по умолчанию
  currentLayer = layers.openstreetmap;
  currentLayer.addTo(map);
}

// Функция смены подложки
function setBaseLayer(key) {
  const newLayer = layers[key];

  // Если такой слой существует — меняем
  if (newLayer) {
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }
    currentLayer = newLayer;
    currentLayer.addTo(map);
  } else {
    console.error("Слой не найден:", key);
  }
}

// Загрузка точек маршрута из JSON
async function loadRoute(fileUrl) {
  try {
    const response = await fetch(fileUrl);
    const points = await response.json();
    addPointsToMap(points);
  } catch (e) {
    alert("Ошибка загрузки маршрута: " + e.message);
  }
}

// Добавление точек на карту
function addPointsToMap(points) {
  // Удаляем старые метки
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Добавляем новые
  points.forEach(point => {
    const popupContent = `
      <h3 style="margin:0">${point.name}</h3>
      <p style="margin:8px 0">${point.description}</p>
      ${point.image ? `<img src="${point.image}" width="250" style="border-radius:8px">` : ''}
      ${point.video ? `<br><iframe width="250" height="150" src="${point.video}" frameborder="0" allowfullscreen></iframe>` : ''}
    `;
    L.marker([point.lat, point.lng])
      .addTo(map)
      .bindPopup(popupContent);
  });
}

// Импорт маршрута с компьютера
function importRoute() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  if (!file) {
    alert("Выберите файл маршрута (.json)");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const points = JSON.parse(e.target.result);
      addPointsToMap(points);
    } catch (err) {
      alert("Ошибка: неверный формат JSON");
    }
  };
  reader.readAsText(file);
}

// Запуск при загрузке страницы
window.addEventListener('load', () => {
  initMap(); // Создаём карту
  loadRoute('data/route.json'); // Загружаем маршрут
});
