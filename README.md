# 🌦️ Mapa Meteorológico Integral

Aplicación web que permite buscar cualquier lugar del mundo, verlo en un mapa interactivo y consultar su clima actual con datos reales.

**Autora:** Ailin Vasquez
**Asignatura:** IAW — Mtro. René Peña Martínez

## Objetivo de la práctica

Integrar una aplicación web funcional de visualización meteorológica aplicando control de versiones con Git, sincronización remota con GitHub, resolución de conflictos y despliegue en GitHub Pages.

## Tecnologías

- HTML5, CSS3 y JavaScript (sin frameworks)
- Leaflet (mapa interactivo)
- Git y GitHub / GitHub Pages
- Visual Studio Code

## APIs y atribuciones

| Servicio | Uso | Clave |
|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Datos del mapa (© colaboradores de OpenStreetMap) | No |
| [Esri World Street Map](https://www.esri.com/) | Mosaicos visuales del mapa | No |
| [Nominatim](https://nominatim.openstreetmap.org/) | Búsqueda de lugares y coordenadas | No |
| [Open-Meteo](https://open-meteo.com/) | Clima actual (temperatura, humedad, viento, condición) | No |

No se usa ninguna API key, por lo que no hay secretos expuestos en el código.

## Estructura de archivos

```
app-mapa-meteorologico/
├── index.html   # estructura de la página
├── style.css    # diseño en tonos vino
├── app.js       # lógica: búsqueda, mapa y clima
└── README.md    # documentación
```

## Ejecutar localmente

1. Abre la carpeta en Visual Studio Code.
2. Instala la extensión **Live Server**.
3. Clic derecho en `index.html` → **Open with Live Server**.

## Publicar en GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En **Branch** elige `main` y la carpeta `/ (root)`, luego **Save**.
3. Espera uno o dos minutos y abre la URL publicada.

## Funcionalidades

- Búsqueda de ciudades, estados, países y lugares con validación de campo vacío
- Mapa con zoom, marcador y centrado automático
- Clima real: temperatura, sensación térmica, humedad, viento, condición y hora de actualización
- Selección de otras coincidencias o de un punto directamente en el mapa
- Indicador de carga y mensajes de error claros
- Diseño adaptable a computadora, tableta y celular

## Enlaces

- Repositorio: https://github.com/TU-USUARIO/app-mapa-meteorologico
- Aplicación publicada: https://TU-USUARIO.github.io/app-mapa-meteorologico/
- Historial de commits: https://github.com/TU-USUARIO/app-mapa-meteorologico/commits/main

## Evidencias para la rúbrica

1. Captura de `git status`, `git branch` y del primer commit.
2. Captura de `git log --oneline` con commits secuenciales.
3. Captura de `git remote -v` y del repositorio en GitHub con los archivos.
4. Captura del conflicto (marcadores `<<<<<<<`), del archivo resuelto y del commit de fusión.
5. Captura de la aplicación publicada funcionando y los enlaces del repositorio y del sitio.