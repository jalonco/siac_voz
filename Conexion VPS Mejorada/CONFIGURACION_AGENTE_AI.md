# Configuración para Agente AI - Servidor VPS SIAC

## 🎯 Información de Conexión

**Servidores Disponibles:**
- `srv790515.hstgr.cloud`
- `srv981241.hstgr.cloud`

**Usuario:** `root`
**Clave SSH:** `~/.ssh/id_ed25519`

## ⚠️ INSTRUCCIÓN CRÍTICA PARA EL AGENTE AI

**ANTES DE EJECUTAR CUALQUIER COMANDO, SIEMPRE PREGUNTAR AL USUARIO:**

**"¿A qué servidor VPS te quieres conectar?"**
- `srv790515.hstgr.cloud`
- `srv981241.hstgr.cloud`

**Una vez que el usuario especifique el servidor, usar ese servidor en todos los comandos SSH.**

## 🐳 Contenedores Docker Activos

### Contenedores Odoo
- **odoo-web** (web.siac.com.co)
  - Imagen: `odoo:19.0`
  - Puerto interno: `8069`
  - Puerto externo: `8073`
  - Base de datos: `siacdb`
  - Contenedor BD: `odoo-web-db`

- **odoo-bercont** (bercont.siac.com.co)
  - Imagen: `odoo:19.0`
  - Puerto interno: `8069`
  - Puerto externo: `8072`
  - Base de datos: `odoo_bercont`
  - Contenedor BD: `odoo-bercont-db`

- **odoo19** (app.siacshop.com)
  - Imagen: `odoo:19.0`
  - Puerto interno: `8069`
  - Puerto externo: `8069`
  - Base de datos: `odoo19`
  - Contenedor BD: `odoo19-db`

## 🌐 Dominios y Acceso

| **Dominio** | **Contenedor** | **Usuario** | **Contraseña** | **Base de Datos** |
|-------------|----------------|-------------|----------------|-------------------|
| `web.siac.com.co` | `odoo-web` | `admin` | `admin` | `siacdb` |
| `bercont.siac.com.co` | `odoo-bercont` | `admin` | `admin` | `odoo_bercont` |
| `app.siacshop.com` | `odoo19` | `admin` | `admin` | `odoo19` |

## 📁 Estructura de Directorios

```
/opt/odoo-web/          # Contenedor web.siac.com.co
├── addons/            # Módulos personalizados
├── config/            # Configuración odoo.conf
├── data/              # Datos persistentes
└── logs/              # Logs del sistema

/opt/odoo-bercont/     # Contenedor bercont.siac.com.co
├── addons/            # Módulos personalizados
├── config/            # Configuración odoo.conf
├── data/              # Datos persistentes
└── logs/              # Logs del sistema

/opt/odoo19/           # Contenedor app.siacshop.com
├── addons/            # Módulos personalizados
├── config/            # Configuración odoo.conf
├── data/              # Datos persistentes
└── logs/              # Logs del sistema

/root/common_addons/    # Módulos compartidos
├── branding_siac/     # Módulo de branding
└── [otros módulos]/   # Otros módulos disponibles
```

## 🔧 Comandos Esenciales

### Verificar Estado
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker ps | grep odoo"
```

### Verificar Dominios
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "curl -I https://web.siac.com.co"
```

**Nota:** Reemplazar `[SERVIDOR_SELECCIONADO]` con el servidor especificado por el usuario.
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "curl -I https://bercont.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "curl -I https://app.siacshop.com"
```

### Reiniciar Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-web"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-bercont"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo19"
```

### Ver Logs
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-web --tail 50"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-bercont --tail 50"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo19 --tail 50"
```

## 📦 Instalación de Módulos

### Proceso Estándar
1. **Copiar módulo:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/[nombre_modulo] /opt/[contenedor]/addons/"
   ```

2. **Actualizar versión:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/[contenedor]/addons/[nombre_modulo]/__manifest__.py"
   ```

3. **Instalar módulo:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec [contenedor] python3 /usr/bin/odoo -d [base_datos] --stop-after-init --no-http -i [nombre_modulo]"
   ```

### Ejemplo: Instalar branding_siac en web.siac.com.co
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo-web/addons/"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-web/addons/branding_siac/__manifest__.py"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i branding_siac"
```

## 🗄️ Gestión de Base de Datos

### Acceder a Base de Datos
```bash
# web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo-web-db psql -U odoo -d siacdb"

# bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo-bercont-db psql -U odoo -d odoo_bercont"

# app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo19-db psql -U odoo -d odoo19"
```

### Verificar Módulos Instalados
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web-db psql -U odoo -d siacdb -c \"SELECT name, state FROM ir_module_module WHERE name LIKE '%branding%';\""
```

## 🚨 Comandos de Emergencia

### Detener Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker stop odoo-web odoo-web-db odoo-bercont odoo-bercont-db odoo19 odoo19-db"
```

### Iniciar Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker start odoo-web-db odoo-web odoo-bercont-db odoo-bercont odoo19-db odoo19"
```

### Estado del Sistema
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker ps && df -h && free -h"
```

## 🔄 Proceso de Reinicio Completo

### Para un contenedor específico (ejemplo: odoo-web)
1. **Detener contenedores:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cd /opt/odoo-web && docker-compose down"
   ```

2. **Recrear contenedores:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cd /opt/odoo-web && docker-compose up -d"
   ```

3. **Inicializar base de datos:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i base"
   ```

4. **Instalar módulos personalizados:**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i branding_siac"
   ```

## 📋 Verificación Completa

### Comando de Verificación Total
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "
echo '=== VERIFICACIÓN COMPLETA ==='
echo '--- CONTENEDORES ---'
docker ps | grep odoo
echo '--- DOMINIOS ---'
curl -I https://web.siac.com.co 2>/dev/null | head -2
curl -I https://bercont.siac.com.co 2>/dev/null | head -2
curl -I https://app.siacshop.com 2>/dev/null | head -2
echo '--- MÓDULOS BRANDING ---'
docker exec odoo-web-db psql -U odoo -d siacdb -c \"SELECT name, state FROM ir_module_module WHERE name = 'branding_siac';\"
docker exec odoo-bercont-db psql -U odoo -d odoo_bercont -c \"SELECT name, state FROM ir_module_module WHERE name = 'branding_siac';\"
docker exec odoo19-db psql -U odoo -d odoo19 -c \"SELECT name, state FROM ir_module_module WHERE name = 'branding_siac';\"
"
```

## 🎯 Notas Importantes

1. **Siempre usar la clave SSH completa:** `-i ~/.ssh/id_ed25519`
2. **Verificar estado antes de realizar cambios:** `docker ps | grep odoo`
3. **Los contenedores usan volúmenes Docker nativos para persistencia**
4. **Traefik maneja automáticamente SSL y redirecciones**
5. **Todos los contenedores están en la red `traefik-public`**
6. **Las bases de datos usan PostgreSQL 15**
7. **Todos los contenedores Odoo usan la versión 19.0**

---

**Fecha de creación:** `$(date)`
**Versión:** `1.0`
**Para uso del Agente AI**
