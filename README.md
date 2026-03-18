# ◈ Audio Manager

Herramienta de escritorio para escanear colecciones de audio, visualizar metadatos y detectar archivos duplicados mediante huella acústica (Chromaprint).

Soporta los formatos **MP3, FLAC, WAV, AIFF y OGG**.

---

## Requisitos previos

Asegúrate de tener instalado lo siguiente antes de continuar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| fpcalc (Chromaprint) | cualquiera | https://acoustid.org/chromaprint |

> **fpcalc** es el binario de Chromaprint que genera las huellas acústicas. Descarga la versión para tu sistema operativo y coloca el ejecutable en `backend/bin/`:
> - Windows → `backend/bin/fpcalc.exe`
> - Mac/Linux → `backend/bin/fpcalc`

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/audio-manager.git
cd audio-manager
```

### 2. Configurar el backend (Python)

```bash
# Crear entorno virtual
python -m venv .venv

# Activar el entorno virtual
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac / Linux

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar el frontend (Node.js)

```bash
cd frontend
npm install
cd ..
```

---

## Uso

Necesitas dos terminales abiertas en la raíz del proyecto.

### Terminal 1 — Backend

```bash
# Activar entorno virtual si no está activo
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac / Linux

cd backend
python run.py
```

El servidor arranca en `http://localhost:8000`. Puedes verificarlo abriendo esa URL en el navegador — deberías ver:

```json
{ "status": "ok", "fpcalc_available": true }
```

Si `fpcalc_available` es `false`, revisa que el ejecutable esté en `backend/bin/`.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Abre `http://localhost:5173` en el navegador.

---

## Estructura del proyecto

```
audio-manager/
├── backend/
│   ├── main.py           # API FastAPI
│   ├── run.py            # Lanzador del servidor
│   └── bin/
│       └── fpcalc.exe    # Binario Chromaprint (no incluido en el repo)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
├── requirements.txt
└── README.md
```

---

## API — Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor y disponibilidad de fpcalc |
| `POST` | `/scan` | Inicia un escaneo en background |
| `GET` | `/scan/status` | Progreso del escaneo en curso |
| `GET` | `/scan/results` | Resultados completos del último escaneo |
| `DELETE` | `/scan/reset` | Limpia el estado para iniciar un nuevo escaneo |

El body de `POST /scan`:
```json
{
  "folder": "C:\\Users\\Usuario\\Music",
  "detect_duplicates": true
}
```

---

## Solución de problemas

**El backend no arranca**
Verifica que el entorno virtual está activado y que ejecutas `python run.py` desde dentro de la carpeta `backend/`.

**`fpcalc_available: false`**
El ejecutable de Chromaprint no se encontró. Comprueba que está en `backend/bin/fpcalc.exe` (Windows) o `backend/bin/fpcalc` (Mac/Linux) y que tiene permisos de ejecución en Mac/Linux (`chmod +x backend/bin/fpcalc`).

**El frontend no conecta con el backend**
Asegúrate de que ambos servidores están corriendo simultáneamente y de que el backend está en el puerto `8000`.

**No se detectan duplicados aunque existan**
La detección por huella acústica requiere que fpcalc esté disponible. Verifica el punto anterior. Ten en cuenta también que dos archivos son considerados duplicados si suenan igual, independientemente del nombre o formato.
