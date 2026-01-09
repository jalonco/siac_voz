# Documentación Técnica del Proyecto SIAC Voz

Este documento detalla la arquitectura tecnológica, la metodología de desarrollo y las funcionalidades clave del sistema `siac_voz`. Está diseñado para servir como referencia técnica para desarrolladores y agentes de IA.

---

## 1. Arquitectura del Sistema

El sistema utiliza una arquitectura **cliente-servidor** desacoplada, desplegada mediante contenedores Docker.

### 1.1 Backend (API & Lógica de Voz)
El núcleo del procesamiento de voz y gestión de llamadas.

*   **Lenguaje**: Python 3.10
*   **Framework Web**: [FastAPI](https://fastapi.tiangolo.com/) (Asíncrono, alto rendimiento).
*   **Servidor ASGI**: Uvicorn.
*   **Integración Telefónica**: [Twilio Voice API](https://www.twilio.com/docs/voice) (Streams bidireccionales vía WebSocket).
*   **Motor de IA de Voz**: [Pipecat AI](https://docs.pipecat.ai/).
    *   **STT (Speech-to-Text)**: Google Deepgram / Google.
    *   **TTS (Text-to-Speech)**: Gemini Multimodal Live API (o Google TTS).
    *   **VAD (Voice Activity Detection)**: Silero VAD.
*   **Almacenamiento de Archivos**: Google Cloud Storage (GCS) para logs de audio y grabaciones.
*   **Gestión de Configuración**: Sistema basado en archivos JSON (`agent_settings.json`) con endpoints CRUD.

### 1.2 Frontend (Interfaz de Usuario)
Panel de administración para configurar agentes y visualizar métricas.

*   **Framework**: [React 19](https://react.dev/).
*   **Build Tool**: [Vite](https://vitejs.dev/) (Rápido, HMR optimizado).
*   **Lenguaje**: TypeScript (TSX).
*   **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first).
*   **Componentes UI**:
    *   Iconografía: [Lucide React](https://lucide.dev/).
    *   Editor de Código: `react-simple-code-editor` con `prismjs` para resaltado de sintaxis.
    *   Gráficos: [Recharts](https://recharts.org/).
*   **Comunicación API**: [Axios](https://axios-http.com/).

### 1.3 Infraestructura y Despliegue
*   **Contenerización**: Docker & Docker Compose.
*   **Servidor VPS**: Hostinger (Ubuntu/Debian).
*   **Proxy Inverso**: Traefik (Manejo de SSL/TLS automático y enrutamiento).

---

## 2. Funcionalidades Clave

### 2.1 Gestión Multi-Agente
El sistema soporta múltiples perfiles de IA ("Agentes") que pueden ser configurados independientemente.
*   **CRUD de Agentes**: Crear, Leer, Actualizar y Eliminar agentes desde el Frontend.
*   **Configuración por Agente**:
    *   Prompt del Sistema (Personalidad).
    *   Voz (Selección entre +30 voces disponibles).
    *   Idioma.
    *   Variables Dinámicas (Campos personalizados inyectados en el prompt).

### 2.2 Marcador Inteligente (Dialer)
*   **Selector de Agente**: Permite elegir qué agente realizará la llamada antes de marcar.
*   **Inyección de Variables**: Si el agente seleccionado tiene variables definidas (ej: `{{nombre_cliente}}`), el UI genera inputs dinámicos para llenar estos datos antes de iniciar la llamada.
*   **Feedback Visual**: Estado de conexión (Conectando, Llamando, Error) y validación de números.

### 2.3 Procesamiento de Llamadas en Tiempo Real
1.  **Inicio**: Frontend envía solicitud POST `/call` con `to_number` y `agent_id`.
2.  **Conexión**: Backend inicia llamada Twilio y establece un WebSocket (`/media-stream`).
3.  **Pipeline Pipecat**:
    *   Audio entrante (Twilio) -> VAD (Silero) -> STT (Google) -> LLM (Gemini) -> TTS (Google) -> Audio saliente (Twilio).
4.  **Contexto**: El `agent_id` asegura que el LLM use el prompt y la voz correcta para esa llamada específica.

### 2.4 Analíticas y Logs
*   **Registro de Llamadas**: Historial visual con estado, duración, costo y dirección.
*   **Visualización de Datos**: Gráficas de distribución de estados de llamada.
*   **Grabación y Transcripción**:
    *   Las llamadas se graban y suben a GCS.
    *   (Futuro) Transcripciones accesibles desde el panel.

---

## 3. Metodología de Desarrollo y Despliegue

Dada la infraestructura del VPS (sin Node.js instalado), se sigue un flujo de "Build Local, Run Remote".

### 3.1 Flujo de Trabajo
1.  **Desarrollo Local**: Cambios en código Backend (Python) y Frontend (React).
2.  **Build Frontend**: Se ejecuta `npm run build` en la máquina local para generar la carpeta `dist`.
3.  **Subida de Artefactos**: Se sube la carpeta `dist` al VPS usando `scp`.
4.  **Despliegue Backend**: Se hace `git pull` en el VPS para actualizar el código Python y Docker.
5.  **Reinicio**: `docker compose build` (usa la carpeta `dist` subida) y `docker compose up -d`.

### 3.2 Script de Despliegue Automatizado
Existe un script `deploy.sh` en la raíz que automatiza todo el proceso:
```bash
./deploy.sh
```
*   Compila el frontend localmente.
*   Sube los archivos estáticos.
*   Sincroniza el repositorio en el servidor (usando `git reset --hard` para evitar conflictos).
*   Reinicia los contenedores.

---

## 4. Estructura de Archivos Principal

```
siac_voz/
├── main.py                 # Punto de entrada FastAPI (Rutas API, WebSocket)
├── bot.py                  # Lógica del bot de voz (Pipecat pipeline)
├── settings_manager.py     # Gestor de configuración (CRUD JSON)
├── deploy.sh               # Script de automatización de despliegue
├── Dockerfile              # Definición de contenedor (Python based)
├── docker-compose.yml      # Orquestación de servicios
├── requirements.txt        # Dependencias Python
├── frontend/               # Código fuente React
│   ├── src/
│   │   ├── App.tsx         # Componente principal (Lógica UI)
│   │   └── index.css       # Estilos globales (Tailwind)
│   ├── package.json        # Dependencias Node
│   └── vite.config.ts      # Configuración de Build
└── contextoIA/             # Documentación para Agentes AI
    ├── GUIA_DESPLIEGUE.md
    └── DOCUMENTACION_TECNICA.md
```
