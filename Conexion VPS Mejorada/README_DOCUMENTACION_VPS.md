# 📚 Documentación del Servidor VPS - SIAC

## 🎯 Descripción General

Esta documentación contiene toda la información necesaria para gestionar el servidor VPS de SIAC, incluyendo conexión SSH, gestión de contenedores Docker, instalación de módulos y administración de bases de datos.

---

## 📁 Archivos de Documentación

### 1. **CONEXION_VPS_DOCUMENTACION.md**
**Documentación completa y detallada**
- Información general del servidor
- Configuración de clave SSH
- Estructura de contenedores Docker
- Comandos útiles y gestión de módulos
- Procesos de actualización y emergencia

### 2. **COMANDOS_RAPIDOS_VPS.md**
**Comandos de uso inmediato**
- Comandos básicos de conexión
- Gestión rápida de contenedores
- Instalación rápida de módulos
- Comandos de emergencia
- Verificación completa del sistema

### 3. **COMANDOS_VPS_UTILES.sh**
**Script interactivo ejecutable**
- Menú interactivo para gestión del VPS
- Funciones automatizadas
- Verificación de estado
- Instalación de módulos
- Gestión de base de datos

### 4. **CONFIGURACION_AGENTE_AI.md**
**Configuración específica para Agente AI**
- Información estructurada para IA
- Comandos esenciales
- Procesos estándar
- Verificación completa

---

## 🚀 Uso de la Documentación

### Para Uso Manual
1. **Consulta rápida:** Usar `COMANDOS_RAPIDOS_VPS.md`
2. **Documentación completa:** Usar `CONEXION_VPS_DOCUMENTACION.md`
3. **Script interactivo:** Ejecutar `./COMANDOS_VPS_UTILES.sh`

### Para Agente AI
1. **Proporcionar:** `INSTRUCCIONES_AGENTE_AI.md` (CRÍTICO - leer primero)
2. **Proporcionar:** `CONFIGURACION_AGENTE_AI.md`
3. **Incluir:** `CONEXION_VPS_DOCUMENTACION.md` como referencia completa

**⚠️ IMPORTANTE:** El agente AI DEBE leer primero `INSTRUCCIONES_AGENTE_AI.md` que contiene el protocolo obligatorio de conexión.

---

## 🔑 Información de Conexión

**Servidores Disponibles:**
- `srv790515.hstgr.cloud`
- `srv981241.hstgr.cloud`

**Usuario:** `root`
**Clave SSH:** `~/.ssh/id_ed25519`

**⚠️ IMPORTANTE:** Siempre preguntar al usuario qué servidor usar antes de ejecutar comandos.

**Comandos:**
```bash
# Servidor 1
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud

# Servidor 2
ssh -i ~/.ssh/id_ed25519 root@srv981241.hstgr.cloud
```

---

## 🐳 Contenedores Activos

| **Dominio** | **Contenedor** | **Puerto** | **Base de Datos** |
|-------------|----------------|------------|-------------------|
| `web.siac.com.co` | `odoo-web` | `8073` | `siacdb` |
| `bercont.siac.com.co` | `odoo-bercont` | `8072` | `odoo_bercont` |
| `app.siacshop.com` | `odoo19` | `8069` | `odoo19` |

---

## 📋 Comandos Esenciales

### Verificar Estado
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker ps | grep odoo"
```

### Verificar Dominios
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "curl -I https://web.siac.com.co"
```

### Instalar Módulo
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo-web/addons/"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-web/addons/branding_siac/__manifest__.py"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i branding_siac"
```

---

## 🛠️ Script Interactivo

Para usar el script interactivo:

```bash
# Hacer ejecutable (si no lo está)
chmod +x COMANDOS_VPS_UTILES.sh

# Ejecutar
./COMANDOS_VPS_UTILES.sh
```

El script incluye:
- Menú interactivo
- Verificación de estado
- Gestión de contenedores
- Instalación de módulos
- Acceso a base de datos
- Comandos de emergencia

---

## 🎯 Casos de Uso Comunes

### 1. Verificar Estado del Sistema
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker ps && df -h && free -h"
```

### 2. Reiniciar un Contenedor
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-web"
```

### 3. Ver Logs de un Contenedor
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-web --tail 50"
```

### 4. Instalar Módulo en Todos los Contenedores
```bash
# Para web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo-web/addons/"

# Para bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo-bercont/addons/"

# Para app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo19/addons/"
```

---

## 🚨 Comandos de Emergencia

### Detener Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker stop odoo-web odoo-web-db odoo-bercont odoo-bercont-db odoo19 odoo19-db"
```

### Iniciar Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker start odoo-web-db odoo-web odoo-bercont-db odoo-bercont odoo19-db odoo19"
```

---

## 📝 Notas Importantes

1. **Siempre usar la clave SSH completa:** `-i ~/.ssh/id_ed25519`
2. **Verificar estado antes de realizar cambios**
3. **Hacer backup antes de modificaciones importantes**
4. **Los contenedores usan volúmenes Docker nativos**
5. **Traefik maneja automáticamente SSL y redirecciones**

---

## 🔄 Actualización de Documentación

Para mantener la documentación actualizada:

1. **Verificar cambios en el servidor**
2. **Actualizar comandos si es necesario**
3. **Probar comandos antes de documentar**
4. **Mantener consistencia entre archivos**

---

**Fecha de creación:** `$(date)`
**Versión:** `1.0`
**Mantenido por:** SIAC Team

---

## 📞 Soporte

Para cualquier duda o problema con la documentación o el servidor VPS, contactar al equipo de SIAC.
