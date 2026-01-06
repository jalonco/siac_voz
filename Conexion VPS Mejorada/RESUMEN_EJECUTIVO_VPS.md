# 📋 RESUMEN EJECUTIVO - Documentación VPS SIAC

## 🎯 Propósito

Esta documentación permite a cualquier agente AI gestionar los servidores VPS de SIAC de manera segura y eficiente, **SIEMPRE preguntando primero al usuario qué servidor usar**.

---

## ⚠️ INSTRUCCIÓN CRÍTICA

**ANTES DE EJECUTAR CUALQUIER COMANDO SSH, EL AGENTE AI DEBE PREGUNTAR:**

```
"¿A qué servidor VPS te quieres conectar?"
- srv790515.hstgr.cloud
- srv981241.hstgr.cloud
```

---

## 📁 Archivos Clave

### Para Agente AI (en orden de prioridad):
1. **`INSTRUCCIONES_AGENTE_AI.md`** - ⚠️ **LEER PRIMERO**
2. **`CONFIGURACION_AGENTE_AI.md`** - Configuración técnica
3. **`CONEXION_VPS_DOCUMENTACION.md`** - Documentación completa

### Para Uso Manual:
1. **`COMANDOS_RAPIDOS_VPS.md`** - Comandos inmediatos
2. **`COMANDOS_VPS_UTILES.sh`** - Script interactivo
3. **`README_DOCUMENTACION_VPS.md`** - Guía de uso

---

## 🔑 Información Esencial

**Servidores:** `srv790515.hstgr.cloud` y `srv981241.hstgr.cloud`
**Usuario:** `root`
**Clave SSH:** `~/.ssh/id_ed25519`

**Comando genérico:**
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO]
```

---

## 🐳 Contenedores (en ambos servidores)

| **Dominio** | **Contenedor** | **Puerto** | **Base de Datos** |
|-------------|----------------|------------|-------------------|
| `web.siac.com.co` | `odoo-web` | `8073` | `siacdb` |
| `bercont.siac.com.co` | `odoo-bercont` | `8072` | `odoo_bercont` |
| `app.siacshop.com` | `odoo19` | `8069` | `odoo19` |

---

## 🚀 Comandos Esenciales

### Verificar Estado
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker ps | grep odoo"
```

### Verificar Dominios
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "curl -I https://web.siac.com.co"
```

### Instalar Módulo
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "cp -r /root/common_addons/branding_siac /opt/odoo-web/addons/"
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/odoo-web/addons/branding_siac/__manifest__.py"
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker exec odoo-web python3 /usr/bin/odoo -d siacdb --stop-after-init --no-http -i branding_siac"
```

---

## 🎯 Flujo de Trabajo Recomendado

### Para Agente AI:
1. **Leer** `INSTRUCCIONES_AGENTE_AI.md`
2. **Preguntar** al usuario qué servidor usar
3. **Usar** el servidor especificado en todos los comandos
4. **Consultar** `CONFIGURACION_AGENTE_AI.md` para comandos específicos

### Para Usuario Manual:
1. **Consultar** `COMANDOS_RAPIDOS_VPS.md` para comandos inmediatos
2. **Ejecutar** `./COMANDOS_VPS_UTILES.sh` para gestión interactiva
3. **Referenciar** `CONEXION_VPS_DOCUMENTACION.md` para detalles completos

---

## 🚨 Comandos de Emergencia

### Detener Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker stop odoo-web odoo-web-db odoo-bercont odoo-bercont-db odoo19 odoo19-db"
```

### Iniciar Todos los Contenedores
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "docker start odoo-web-db odoo-web odoo-bercont-db odoo-bercont odoo19-db odoo19"
```

---

## 📊 Verificación Completa

```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO] "
echo '=== VERIFICACIÓN COMPLETA ==='
echo '--- CONTENEDORES ---'
docker ps | grep odoo
echo '--- DOMINIOS ---'
curl -I https://web.siac.com.co 2>/dev/null | head -2
curl -I https://bercont.siac.com.co 2>/dev/null | head -2
curl -I https://app.siacshop.com 2>/dev/null | head -2
"
```

---

## ✅ Checklist de Implementación

- [ ] Agente AI lee `INSTRUCCIONES_AGENTE_AI.md`
- [ ] Agente AI pregunta al usuario qué servidor usar
- [ ] Agente AI usa el servidor especificado en todos los comandos
- [ ] Usuario confirma que el servidor seleccionado es correcto
- [ ] Comandos se ejecutan con el servidor correcto

---

## 📝 Notas Importantes

1. **NUNCA asumir un servidor por defecto**
2. **SIEMPRE preguntar antes de ejecutar comandos SSH**
3. **Mantener consistencia del servidor en toda la sesión**
4. **Verificar estado antes de realizar cambios importantes**
5. **Los contenedores usan volúmenes Docker nativos**

---

**Fecha de creación:** `$(date)`
**Versión:** `1.0`
**Para:** Gestión segura de servidores VPS SIAC
