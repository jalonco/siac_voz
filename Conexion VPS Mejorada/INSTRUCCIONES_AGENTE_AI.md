# 🎯 INSTRUCCIONES CRÍTICAS PARA AGENTE AI - SIAC VPS

## ⚠️ INSTRUCCIÓN PRINCIPAL

**ANTES DE EJECUTAR CUALQUIER COMANDO SSH, SIEMPRE DEBES PREGUNTAR AL USUARIO:**

---

## 🤖 PROTOCOLO DE CONEXIÓN

### 1. **PREGUNTA OBLIGATORIA**
```
"¿A qué servidor VPS te quieres conectar?"

Opciones disponibles:
- srv790515.hstgr.cloud
- srv981241.hstgr.cloud
```

### 2. **ESPERAR RESPUESTA DEL USUARIO**
- El usuario debe especificar exactamente uno de los servidores
- NO asumir ningún servidor por defecto
- NO proceder sin confirmación explícita

### 3. **USAR EL SERVIDOR SELECCIONADO**
- Una vez que el usuario especifique el servidor, usar ese servidor en TODOS los comandos SSH
- Reemplazar `[SERVIDOR_SELECCIONADO]` con el servidor especificado

---

## 📋 COMANDOS ESTÁNDAR

### Conexión SSH
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO]
```

### Verificar Estado
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker ps | grep odoo"
```

### Verificar Dominios
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "curl -I https://web.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "curl -I https://bercont.siac.com.co"
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "curl -I https://app.siacshop.com"
```

---

## 🎯 EJEMPLO DE INTERACCIÓN CORRECTA

### ❌ INCORRECTO (NO HACER ESTO):
```
Usuario: "verifica el estado de los contenedores"
Agente: [Ejecuta comando sin preguntar el servidor]
```

### ✅ CORRECTO (HACER ESTO):
```
Usuario: "verifica el estado de los contenedores"
Agente: "¿A qué servidor VPS te quieres conectar? (srv790515.hstgr.cloud o srv981241.hstgr.cloud)"
Usuario: "srv790515.hstgr.cloud"
Agente: [Ejecuta comando con el servidor especificado]
```

---

## 🔧 COMANDOS COMUNES CON SERVIDOR SELECCIONADO

### Gestión de Contenedores
```bash
# Reiniciar contenedor
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker restart odoo-web"

# Ver logs
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker logs odoo-web --tail 50"

# Estado del sistema
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker ps && df -h && free -h"
```

### Instalación de Módulos
```bash
# Copiar módulo
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "cp -r /root/common_addons/branding_siac /opt/odoo-web/addons/"

# Actualizar versión
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-web/addons/branding_siac/__manifest__.py"

# Instalar módulo
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i branding_siac"
```

### Base de Datos
```bash
# Acceder a BD
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker exec -it odoo-web-db psql -U odoo -d siacdb"

# Verificar módulos
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker exec odoo-web-db psql -U odoo -d siacdb -c \"SELECT name, state FROM ir_module_module WHERE name = 'branding_siac';\""
```

---

## 🚨 COMANDOS DE EMERGENCIA

### Detener Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker stop odoo-web odoo-web-db odoo-bercont odoo-bercont-db odoo19 odoo19-db"
```

### Iniciar Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker start odoo-web-db odoo-web odoo-bercont-db odoo-bercont odoo19-db odoo19"
```

---

## 📊 VERIFICACIÓN COMPLETA

```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "
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

---

## 🎯 RECORDATORIO IMPORTANTE

1. **SIEMPRE preguntar el servidor antes de ejecutar comandos**
2. **NO asumir ningún servidor por defecto**
3. **Usar el servidor especificado por el usuario en TODOS los comandos**
4. **Mantener consistencia en toda la sesión**

---

## 📝 NOTAS TÉCNICAS

- **Clave SSH:** `~/.ssh/id_ed25519`
- **Usuario:** `root`
- **Puerto:** `22` (por defecto)
- **Servidores:** `srv790515.hstgr.cloud` y `srv981241.hstgr.cloud`

---

**Esta instrucción es CRÍTICA y debe seguirse en TODAS las interacciones con el servidor VPS.**
