"use strict";

// ---------- Referencias al DOM ----------
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const messageBox = document.getElementById("message");
const loader = document.getElementById("loader");
const resultsList = document.getElementById("results-list");

const placeNameEl = document.getElementById("place-name");
const latEl = document.getElementById("lat");
const lonEl = document.getElementById("lon");
const iconEl = document.getElementById("weather-icon");
const conditionEl = document.getElementById("weather-condition");
const tempEl = document.getElementById("temp");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const updatedEl = document.getElementById("updated");
const rangeEl = document.getElementById("range");
const cardEl = document.getElementById("weather-card");

// ---------- Mapa (Leaflet + OpenStreetMap) ----------
const map = L.map("map").setView([23.6345, -102.5528], 5); // México
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 19,
  attribution: 'Mapa: &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let marker = null;

// Evita que una respuesta lenta pise una consulta más reciente
let requestId = 0;

// ---------- Códigos meteorológicos de Open-Meteo (WMO) ----------
const WEATHER_CODES = {
  0: ["Cielo despejado", "☀️"],
  1: ["Mayormente despejado", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Niebla", "🌫️"],
  48: ["Niebla con escarcha", "🌫️"],
  51: ["Llovizna ligera", "🌦️"],
  53: ["Llovizna moderada", "🌦️"],
  55: ["Llovizna intensa", "🌧️"],
  56: ["Llovizna helada ligera", "🌧️"],
  57: ["Llovizna helada intensa", "🌧️"],
  61: ["Lluvia ligera", "🌦️"],
  63: ["Lluvia moderada", "🌧️"],
  65: ["Lluvia intensa", "🌧️"],
  66: ["Lluvia helada ligera", "🌧️"],
  67: ["Lluvia helada intensa", "🌧️"],
  71: ["Nevada ligera", "🌨️"],
  73: ["Nevada moderada", "🌨️"],
  75: ["Nevada intensa", "❄️"],
  77: ["Granos de nieve", "❄️"],
  80: ["Chubascos ligeros", "🌦️"],
  81: ["Chubascos moderados", "🌧️"],
  82: ["Chubascos violentos", "⛈️"],
  85: ["Chubascos de nieve ligeros", "🌨️"],
  86: ["Chubascos de nieve intensos", "🌨️"],
  95: ["Tormenta eléctrica", "⛈️"],
  96: ["Tormenta con granizo ligero", "⛈️"],
  99: ["Tormenta con granizo fuerte", "⛈️"]
};

// ---------- Utilidades de interfaz ----------
function showMessage(text, type) {
  messageBox.textContent = text; // textContent: nunca se interpreta como HTML
  messageBox.className = type === "info" ? "message info" : "message";
  messageBox.hidden = false;
}

function clearMessage() {
  messageBox.hidden = true;
  messageBox.textContent = "";
}

function setLoading(isLoading) {
  loader.hidden = !isLoading;
  searchBtn.disabled = isLoading;
}

function clearResults() {
  resultsList.replaceChildren();
  resultsList.hidden = true;
}

function resetWeather() {
  iconEl.textContent = "🌍";
  conditionEl.textContent = "Sin datos";
  tempEl.textContent = "—";
  feelsEl.textContent = "—";
  humidityEl.textContent = "—";
  windEl.textContent = "—";
  updatedEl.textContent = "Actualización: —";
  rangeEl.textContent = "Máx: — · Mín: —";
  cardEl.removeAttribute("data-sky");
  cardEl.removeAttribute("data-day");
}

// Tipo de fondo de la tarjeta según el código meteorológico
function skyFromCode(code) {
  if (code === 0 || code === 1) { return "clear"; }
  if (code === 2) { return "partly"; }
  if (code === 3) { return "cloudy"; }
  if (code === 45 || code === 48) { return "fog"; }
  if ([71, 73, 75, 77, 85, 86].includes(code)) { return "snow"; }
  if (code >= 95) { return "storm"; }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { return "rain"; }
  return "cloudy";
}

// ---------- Servicios externos ----------
async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error("El servicio respondió con el código " + response.status);
  }
  return response.json();
}

// Nominatim: buscar lugares por nombre
async function searchPlaces(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=es&q=" +
    encodeURIComponent(query);
  return fetchJson(url);
}

// Nominatim: obtener el nombre de un punto del mapa
async function reversePlace(lat, lon) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=es&zoom=12&lat=" +
    lat + "&lon=" + lon;
  return fetchJson(url);
}

// Open-Meteo: clima actual en unas coordenadas
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "1",
    timezone: "auto"
  });
  return fetchJson("https://api.open-meteo.com/v1/forecast?" + params.toString());
}

// ---------- Mostrar resultados ----------
function formatUpdateTime(isoString) {
  // Open-Meteo devuelve la hora local del lugar, ej. "2026-10-17T14:30"
  const [date, time] = String(isoString).split("T");
  const [y, m, d] = date.split("-");
  return d + "/" + m + "/" + y + " " + time + " (hora local del lugar)";
}

function showLocation(name, lat, lon) {
  placeNameEl.textContent = name;
  latEl.textContent = Number(lat).toFixed(5);
  lonEl.textContent = Number(lon).toFixed(5);

  if (marker) { map.removeLayer(marker); }
  marker = L.marker([lat, lon]).addTo(map);
  marker.bindPopup(L.popup().setContent(document.createTextNode(name))).openPopup();
  map.setView([lat, lon], 11);
}

function showWeather(data) {
  const current = data.current;
  const units = data.current_units;
  if (!current) { throw new Error("Open-Meteo no devolvió datos actuales."); }

  const info = WEATHER_CODES[current.weather_code] || ["Condición no disponible", "🌍"];
  const isDay = current.is_day !== 0;
  const isClearSky = current.weather_code === 0 || current.weather_code === 1;
  iconEl.textContent = (!isDay && isClearSky) ? "🌙" : info[1];

  cardEl.dataset.sky = skyFromCode(current.weather_code);
  cardEl.dataset.day = isDay ? "1" : "0";

  const daily = data.daily;
  if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
    const u = data.daily_units ? data.daily_units.temperature_2m_max : "";
    rangeEl.textContent = "Máx: " + daily.temperature_2m_max[0] + u + " · Mín: " + daily.temperature_2m_min[0] + u;
  }
  conditionEl.textContent = info[0];
  tempEl.textContent = current.temperature_2m + units.temperature_2m;
  feelsEl.textContent = current.apparent_temperature + " " + units.apparent_temperature;
  humidityEl.textContent = current.relative_humidity_2m + " " + units.relative_humidity_2m;
  windEl.textContent = current.wind_speed_10m + " " + units.wind_speed_10m;
  updatedEl.textContent = "Actualización: " + formatUpdateTime(current.time);

  const card = document.getElementById("weather-card");
  card.classList.remove("flash");
  void card.offsetWidth; // reinicia la animación
  card.classList.add("flash");
}

// Selecciona un lugar: actualiza mapa y consulta el clima
async function selectPlace(name, lat, lon) {
  const myRequest = ++requestId;
  clearMessage();
  clearResults();
  setLoading(true);
  try {
    showLocation(name, lat, lon);
    resetWeather();
    const weather = await fetchWeather(lat, lon);
    if (myRequest !== requestId) { return; } // llegó una consulta más nueva
    showWeather(weather);
  } catch (error) {
    console.error(error);
    if (myRequest === requestId) {
      resetWeather();
      showMessage("No se pudo obtener el clima. Revisa tu conexión e inténtalo de nuevo.");
    }
  } finally {
    if (myRequest === requestId) { setLoading(false); }
  }
}

function renderResultsList(places) {
  resultsList.replaceChildren();
  places.forEach((place) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = place.display_name;
    btn.addEventListener("click", () => {
      selectPlace(place.display_name, Number(place.lat), Number(place.lon));
    });
    li.appendChild(btn);
    resultsList.appendChild(li);
  });
  resultsList.hidden = false;
}

// ---------- Eventos ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();

  if (!query) {
    clearResults();
    showMessage("Escribe el nombre de un lugar antes de buscar.");
    input.focus();
    return;
  }

  const myRequest = ++requestId;
  clearMessage();
  clearResults();
  setLoading(true);

  try {
    const places = await searchPlaces(query);
    if (myRequest !== requestId) { return; }

    if (!Array.isArray(places) || places.length === 0) {
      showMessage("No encontramos ese lugar. Revisa la ortografía o prueba con otro nombre.");
      return;
    }

    const first = places[0];
    await selectPlace(first.display_name, Number(first.lat), Number(first.lon));

    if (places.length > 1) {
      renderResultsList(places.slice(1));
      showMessage("¿Buscabas otro lugar? Elige una de las coincidencias.", "info");
    }
  } catch (error) {
    console.error(error);
    if (myRequest === requestId) {
      showMessage("Error de conexión con el servicio de búsqueda. Inténtalo de nuevo en unos segundos.");
    }
  } finally {
    if (myRequest === requestId) { setLoading(false); }
  }
});

// Clic en el mapa: consulta otro punto
map.on("click", async (event) => {
  const lat = event.latlng.lat;
  const lon = event.latlng.lng;
  let name = "Punto seleccionado en el mapa";
  try {
    const place = await reversePlace(lat.toFixed(5), lon.toFixed(5));
    if (place && place.display_name) { name = place.display_name; }
  } catch (error) {
    console.error(error); // si falla, se usa el nombre genérico
  }
  selectPlace(name, lat, lon);
});