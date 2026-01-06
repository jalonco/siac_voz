# Comandos Rápidos para VPS - SIAC

## 🚀 Conexión Básica

```bash
# Conectar al servidor
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud

# Verificar estado de contenedores
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker ps | grep odoo"

# Verificar acceso a dominios
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "curl -I https://web.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "curl -I https://bercont.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "curl -I https://app.siacshop.com"
```

## 🔧 Gestión de Contenedores

```bash
# Reiniciar contenedor específico
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-web"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-bercont"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo19"

# Ver logs de contenedor
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-web --tail 50"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-bercont --tail 50"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo19 --tail 50"

# Estado del sistema
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker ps && df -h && free -h"
```

## 📦 Instalación de Módulos

```bash
# Instalar módulo branding_siac en web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo-web/addons/"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-web/addons/branding_siac/__manifest__.py"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i branding_siac"

# Instalar módulo branding_siac en bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo-bercont/addons/"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-bercont/addons/branding_siac/__manifest__.py"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-bercont python3 /usr/bin/odoo -d odoo_bercont --stop-after-init --no-http -i branding_siac"

# Instalar módulo branding_siac en app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cp -r /root/common_addons/branding_siac /opt/odoo19/addons/"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo19/addons/branding_siac/__manifest__.py"
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo19 python3 /usr/bin/odoo -d odoo19 --stop-after-init --no-http -i branding_siac"
```

## 🗄️ Base de Datos

```bash
# Acceder a base de datos web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo-web-db psql -U odoo -d siacdb"

# Acceder a base de datos bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo-bercont-db psql -U odoo -d odoo_bercont"

# Acceder a base de datos app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo19-db psql -U odoo -d odoo19"

# Verificar módulos instalados
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web-db psql -U odoo -d siacdb -c \"SELECT name, state FROM ir_module_module WHERE name LIKE '%branding%';\""

# Crear usuario administrador
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec odoo-web-db psql -U odoo -d siacdb -c \"INSERT INTO res_users (login, password, active, company_id, create_date, write_date) VALUES ('admin', 'admin', true, 1, NOW(), NOW()) RETURNING id;\""
```

## 🔄 Reinicio Completo de Contenedor

```bash
# Reinicio completo de web.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cd /opt/odoo-web && docker-compose down && docker-compose up -d"

# Reinicio completo de bercont.siac.com.co
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cd /opt/odoo-bercont && docker-compose down && docker-compose up -d"

# Reinicio completo de app.siacshop.com
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "cd /opt/odoo19 && docker-compose down && docker-compose up -d"
```

## 🚨 Comandos de Emergencia

```bash
# Detener todos los contenedores
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker stop odoo-web odoo-web-db odoo-bercont odoo-bercont-db odoo19 odoo19-db"

# Iniciar todos los contenedores
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker start odoo-web-db odoo-web odoo-bercont-db odoo-bercont odoo19-db odoo19"

# Verificar estado completo
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "echo '=== CONTENEDORES ===' && docker ps && echo '=== ESPACIO ===' && df -h && echo '=== MEMORIA ===' && free -h"
```

## 📋 Verificación Completa

```bash
# Verificación completa del sistema
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

## 🎯 Comandos Específicos por Dominio

### web.siac.com.co
```bash
# Contenedor: odoo-web
# Base de datos: siacdb
# Puerto: 8073

# Ver logs
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-web --tail 20"

# Reiniciar
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-web"

# Acceder a BD
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo-web-db psql -U odoo -d siacdb"
```

### bercont.siac.com.co
```bash
# Contenedor: odoo-bercont
# Base de datos: odoo_bercont
# Puerto: 8072

# Ver logs
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo-bercont --tail 20"

# Reiniciar
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo-bercont"

# Acceder a BD
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo-bercont-db psql -U odoo -d odoo_bercont"
```

### app.siacshop.com
```bash
# Contenedor: odoo19
# Base de datos: odoo19
# Puerto: 8069

# Ver logs
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker logs odoo19 --tail 20"

# Reiniciar
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker restart odoo19"

# Acceder a BD
ssh -i ~/.ssh/id_ed25519 root@srv790515.hstgr.cloud "docker exec -it odoo19-db psql -U odoo -d odoo19"
```

---

**Nota:** Todos los comandos usan la clave SSH `~/.ssh/id_ed25519` y se conectan al servidor `srv790515.hstgr.cloud` como usuario `root`.
