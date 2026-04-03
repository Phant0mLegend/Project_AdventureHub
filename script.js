let map = L.map('map').setView([55.7558, 37.6176], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Загрузка маршрута из JSON
async function loadRoute(fileUrl) {
  try {
    const response = await fetch(fileUrl);
    const points = await response.json();
    addPointsToMap(points);
  } catch (e) {
    alert("Ошибка загрузки маршрута");
  }
}

function addPointsToMap(points) {
  map.eachLayer((layer) => {
    if (layer.options && layer.options.pane === 'markerPane') {
      map.removeLayer(layer);
    }
  });

  points.forEach(point => {
    const popupContent = `
      <h3>${point.name}</h3>
      <p>${point.description}</p>
      <img src="${point.image}" width="200" alt="${point.name}">
      <br>
      <iframe width="200" height="150" src="${point.video}" frameborder="0"></iframe>
    `;
    L.marker([point.lat, point.lng]).addTo(map)
      .bindPopup(popupContent);
  });
}

// Импорт маршрута через файл
function importRoute() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  if (!file) {
    alert("Выберите файл");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const points = JSON.parse(e.target.result);
      addPointsToMap(points);
    } catch (err) {
      alert("Неверный формат JSON");
    }
  };
  reader.readAsText(file);
}

// Загрузка начального маршрута
loadRoute('data/route.json');
