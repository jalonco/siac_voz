# Metodología de Actualización y Mantenimiento

Este documento describe el flujo de trabajo para mantener y actualizar el agente de voz.

## Flujo de Trabajo con Git

El proyecto está alojado en GitHub: [https://github.com/jalonco/siac_voz](https://github.com/jalonco/siac_voz)

### 1. Descargar Actualizaciones (Deploy)

Si estás en el servidor de producción o en otro entorno y necesitas traer los últimos cambios:

```bash
# 1. Traer los cambios del repositorio remoto
git pull origin main

# 2. Instalar nuevas dependencias (si requirements.txt cambió)
pip install -r requirements.txt

# 3. Reiniciar el servicio (ejemplo manual)
# Detén el proceso actual (Ctrl+C) y vuelve a ejecutar:
python main.py
```

### 2. Subir Cambios (Desarrollo)

Si has modificado el código y quieres guardar los cambios en GitHub:

```bash
# 1. Ver qué archivos han cambiado
git status

# 2. Agregar los archivos al área de preparación
git add .

# 3. Guardar los cambios con un mensaje descriptivo
git commit -m "Descripción de lo que cambiaste o mejoraste"

# 4. Enviar a GitHub
git push origin main
```

## Solución de Problemas Comunes

*   **Error de dependencias**: Si al actualizar falla el arranque, asegúrate de correr `pip install -r requirements.txt`.
*   **Cambio de Dominio (ngrok)**: Si reinicias ngrok, tu URL pública cambiará. Recuerda actualizar la variable `DOMAIN` en el archivo `.env` y el webhook en la consola de Twilio.
