# Documentación de Conexión al Servidor VPS - SIAC

## 📋 Información General

**Servidores Disponibles:**
- `srv790515.hstgr.cloud`
- `srv981241.hstgr.cloud`

**Usuario:** `root`
**Puerto SSH:** `22` (por defecto)
**Tipo de Clave:** `Ed25519`

## 🎯 Selección de Servidor

**IMPORTANTE:** Antes de ejecutar cualquier comando, debes especificar a qué servidor VPS te quieres conectar:

- **Servidor 1:** `srv790515.hstgr.cloud`
- **Servidor 2:** `srv981241.hstgr.cloud`

**Pregunta al usuario:** "¿A qué servidor VPS te quieres conectar? (srv790515.hstgr.cloud o srv981241.hstgr.cloud)"

---

## 🔑 Configuración de Clave SSH

### Ubicación de la Clave Privada
```bash
~/.ssh/id_ed25519
```

### Comando de Conexión Estándar
```bash
# Servidor 1
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud

# Servidor 2
ssh -i ~/.ssh/id_ed25519 root@srv981241.hstgr.cloud
```

**Nota:** Reemplaza `[SERVIDOR]` con el servidor seleccionado por el usuario.

---

## 🐳 Contenedores Docker Activos

### Contenedores Odoo
| **Contenedor** | **Imagen** | **Puerto Interno** | **Puerto Externo** | **Base de Datos** |
|----------------|------------|-------------------|-------------------|-------------------|
| `odoo-web` | `odoo:19.0` | `8069` | `8073` | `siacdb` |
| `odoo-bercont` | `odoo:19.0` | `8069` | `8072` | `odoo_bercont` |
| `odoo19` | `odoo:19.0` | `8069` | `8069` | `odoo19` |

### Contenedores PostgreSQL
| **Contenedor** | **Imagen** | **Puerto** | **Base de Datos** |
|----------------|------------|-----------|-------------------|
| `odoo-web-db` | `postgres:15` | `5432` | `siacdb` |
| `odoo-bercont-db` | `postgres:15` | `5432` | `odoo_bercont` |
| `odoo19-db` | `postgres:15` | `5432` | `odoo19` |

---

## 🌐 Dominios y Configuración

### Dominios Activos
| **Dominio** | **Contenedor** | **Estado** |
|-------------|----------------|------------|
| `web.siac.com.co` | `odoo-web` | ✅ Activo |
| `bercont.siac.com.co` | `odoo-bercont` | ✅ Activo |
| `app.siacshop.com` | `odoo19` | ✅ Activo |

### Configuración Traefik
- **Red:** `traefik-public`
- **SSL:** Let's Encrypt
- **Redirección:** HTTP → HTTPS automática

---

## 📁 Estructura de Directorios

### Directorios Principales
```bash
/opt/odoo-web/          # Contenedor web.siac.com.co
/opt/odoo-bercont/      # Contenedor bercont.siac.com.co
/opt/odoo19/            # Contenedor app.siacshop.com
/root/common_addons/    # Módulos compartidos
```

### Estructura de Cada Contenedor
```bash
/opt/odoo-*/addons/     # Módulos personalizados
/opt/odoo-*/config/     # Configuración odoo.conf
/opt/odoo-*/data/       # Datos persistentes
/opt/odoo-*/logs/       # Logs del sistema
```

---

## 🔧 Comandos Útiles

### Verificar Estado de Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR] "docker ps | grep odoo"
```

### Verificar Acceso a Dominios
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR] "curl -I https://web.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR] "curl -I https://bercont.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR] "curl -I https://app.siacshop.com"
```

**Nota:** Reemplaza `[SERVIDOR]` con el servidor seleccionado (srv790515.hstgr.cloud o srv981241.hstgr.cloud)

### Acceder a Base de Datos
```bash
# Base de datos web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web-db psql -U odoo -d siacdb"

# Base de datos bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-bercont-db psql -U odoo -d odoo_bercont"

# Base de datos app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo19-db psql -U odoo -d odoo19"
```

### Ejecutar Comandos en Contenedores Odoo
```bash
# Contenedor web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i [modulo]"

# Contenedor bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-bercont python3 /usr/bin/odoo -d odoo_bercont --stop-after-init --no-http -i [modulo]"

# Contenedor app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo19 python3 /usr/bin/odoo -d odoo19 --stop-after-init --no-http -i [modulo]"
```

---

## 🛠️ Gestión de Contenedores

### Reiniciar Contenedores
```bash
# Reiniciar contenedor específico
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-web"

# Reiniciar todos los contenedores Odoo
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-web odoo-bercont odoo19"
```

### Ver Logs de Contenedores
```bash
# Logs del contenedor web
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-web --tail 50"

# Logs del contenedor bercont
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-bercont --tail 50"

# Logs del contenedor app
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo19 --tail 50"
```

---

## 📦 Gestión de Módulos

### Instalar Módulo desde common_addons
```bash
# Copiar módulo
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/[nombre_modulo] /opt/odoo-web/addons/"

# Actualizar versión a 19.0
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-web/addons/[nombre_modulo]/__manifest__.py"

# Instalar módulo
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i [nombre_modulo]"
```

### Verificar Módulos Instalados
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web-db psql -U odoo -d siacdb -c \"SELECT name, state FROM ir_module_module WHERE name = '[nombre_modulo]';\""
```

---

## 🔐 Credenciales de Acceso

### Usuarios por Dominio
| **Dominio** | **Usuario** | **Contraseña** | **Base de Datos** |
|-------------|-------------|----------------|-------------------|
| `web.siac.com.co` | `admin` | `admin` | `siacdb` |
| `bercont.siac.com.co` | `admin` | `admin` | `odoo_bercont` |
| `app.siacshop.com` | `admin` | `admin` | `odoo19` |

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

### Verificar Estado del Sistema
```bash
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "echo '=== ESTADO DEL SISTEMA ===' && docker ps && echo '=== ESPACIO EN DISCO ===' && df -h && echo '=== MEMORIA ===' && free -h"
```

---

## 📝 Notas Importantes

1. **Siempre usar la clave SSH completa:** `-i ~/.ssh/id_ed25519`
2. **Verificar estado antes de realizar cambios:** `docker ps | grep odoo`
3. **Hacer backup antes de modificaciones importantes**
4. **Los contenedores usan volúmenes Docker nativos para persistencia**
5. **Traefik maneja automáticamente SSL y redirecciones**

---

## 🔄 Proceso de Actualización

### Actualizar a Odoo 19
1. Detener contenedores
2. Modificar `docker-compose.yml` (cambiar imagen a `odoo:19.0`)
3. Recrear contenedores con `docker-compose up -d`
4. Inicializar base de datos con `-i base`
5. Instalar módulos personalizados
6. Verificar funcionamiento

---

**Fecha de creación:** `$(date)`
**Versión:** `1.0`
**Mantenido por:** SIAC Team