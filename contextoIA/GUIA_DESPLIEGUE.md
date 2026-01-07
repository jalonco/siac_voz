# Guía de Despliegue y Mantenimiento (AI Context)

Esta guía documenta el **flujo de trabajo comprobado** para actualizar eficientemente el proyecto `siac_voz`. Está diseñada para que cualquier agente IA o desarrollador siga los pasos exactos que funcionan en la infraestructura actual.

## 1. Contexto del Proyecto

*   **Repositorio GitHub**: `https://github.com/jalonco/siac_voz`
*   **Servidor VPS**: `srv1135658.hstgr.cloud` (Usuario: `root`)
*   **Directorio en VPS**: `/opt/siac_voz`
*   **Tecnología**: Stack Dockerizado (FastAPI + React/Vite + Twilio).
*   **Restricción Clave**: El VPS **NO** tiene `npm` instalado. El frontend **DEBE** construirse localmente.

## 2. Flujo de Trabajo para Actualizaciones

### Paso 1: Desarrollo Local y Push
Realiza los cambios en tu entorno local.
1.  Modifica el código.
2.  Prueba localmente (`python main.py` / `npm run dev`).
3.  Sube cambios a GitHub:
    ```bash
    git add .
    git commit -m "feat: descripción del cambio"
    git push origin main
    ```

### Paso 2: Construcción del Frontend (LOCAL)
Como el VPS no puede construir el frontend, hazlo en tu máquina:
1.  Ve al directorio frontend:
    ```bash
    cd frontend
    ```
2.  Instala dependencias (si hay nuevas) y construye:
    ```bash
    npm install
    npm run build
    ```
    *Esto generará la carpeta `dist`.*

### Paso 3: Subida de Artefactos (SCP)
Sube la carpeta `dist` construida directamente al VPS:
```bash
# Ejecutar desde la raíz del proyecto local
scp -o BatchMode=yes -r frontend/dist root@srv1135658.hstgr.cloud:/opt/siac_voz/frontend/
```

### Paso 4: Despliegue en VPS (Docker)
Conéctate y actualiza el contenedor Docker.
1.  Conectar por SSH:
    ```bash
    ssh root@srv1135658.hstgr.cloud
    ```
2.  Navegar y actualizar código base:
    ```bash
    cd /opt/siac_voz
    git pull origin main
    ```
    *(Nota: El `git pull` trae cambios de backend. El frontend ya se actualizó vía SCP).*
3.  Reconstruir y Reiniciar Contenedores:
    ```bash
    docker compose build
    docker compose up -d
    ```

## 3. Comandos Útiles de Verificación

*   **Verificar logs del contenedor**:
    ```bash
    ssh root@srv1135658.hstgr.cloud "cd /opt/siac_voz && docker compose logs -f --tail=50"
    ```
*   **Verificar estado de contenedores**:
    ```bash
    ssh root@srv1135658.hstgr.cloud "docker ps | grep siac_voz"
    ```
*   **Probar endpoint en vivo**:
    ```bash
    curl -v "https://voz.siac.com.co/calls?limit=5"
    ```

## 4. Notas Técnicas Importantes

*   **Dockerfile**: El `Dockerfile` en producción ha sido modificado para **NO** intentar construir el frontend. Simplemente copiará la carpeta `frontend/dist` que subimos vía SCP. No sobreescribas el Dockerfile del servidor con el local si el local intenta hacer `npm run build`.
*   **Twilio Attributes**: La librería de Twilio usa `_from` en lugar de `from_` para acceder al número de origen en versiones recientes.
*   **Puerto**: La aplicación corre internamente en el puerto `8765`.
