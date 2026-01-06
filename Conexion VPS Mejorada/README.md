# 📁 Conexión VPS Mejorada - SIAC

## 🎯 Descripción

Esta carpeta contiene toda la documentación mejorada para la gestión de servidores VPS de SIAC, diseñada específicamente para trabajar con múltiples servidores y agentes AI.

---

## 📋 Archivos Incluidos

### 🤖 Para Agente AI (en orden de prioridad):

1. **`INSTRUCCIONES_AGENTE_AI.md`** ⚠️ **CRÍTICO - LEER PRIMERO**
   - Protocolo obligatorio de conexión
   - Pregunta obligatoria sobre servidor
   - Ejemplos de interacción correcta

2. **`CONFIGURACION_AGENTE_AI.md`**
   - Configuración técnica estructurada
   - Comandos esenciales con placeholders
   - Procesos estándar

3. **`CONEXION_VPS_DOCUMENTACION.md`**
   - Documentación completa y detallada
   - Información de ambos servidores
   - Comandos útiles y gestión de módulos

4. **`RESUMEN_EJECUTIVO_VPS.md`**
   - Resumen ejecutivo de toda la documentación
   - Checklist de implementación
   - Flujo de trabajo recomendado

### 👤 Para Uso Manual:

5. **`COMANDOS_RAPIDOS_VPS.md`**
   - Comandos de uso inmediato
   - Gestión rápida de contenedores
   - Comandos de emergencia

6. **`COMANDOS_VPS_UTILES.sh`**
   - Script interactivo ejecutable
   - Menú interactivo para gestión del VPS
   - Funciones automatizadas

7. **`README_DOCUMENTACION_VPS.md`**
   - Guía de uso de la documentación
   - Instrucciones de uso
   - Casos de uso comunes

---

## 🚀 Uso Rápido

### Para Agente AI:
1. **Leer primero:** `INSTRUCCIONES_AGENTE_AI.md`
2. **Preguntar al usuario:** "¿A qué servidor VPS te quieres conectar?"
3. **Usar el servidor especificado** en todos los comandos SSH

### Para Usuario Manual:
1. **Comandos rápidos:** `COMANDOS_RAPIDOS_VPS.md`
2. **Script interactivo:** `./COMANDOS_VPS_UTILES.sh`
3. **Documentación completa:** `CONEXION_VPS_DOCUMENTACION.md`

---

## 🔑 Servidores Disponibles

- **srv790515.hstgr.cloud**
- **srv981241.hstgr.cloud**

**Comando genérico:**
```bash
ssh -i ~/.ssh/id_ed25519 root@[SERVIDOR_SELECCIONADO]
```

---

## ⚠️ Instrucción Crítica

**ANTES DE EJECUTAR CUALQUIER COMANDO SSH, EL AGENTE AI DEBE PREGUNTAR:**

```
"¿A qué servidor VPS te quieres conectar?"
- srv790515.hstgr.cloud
- srv981241.hstgr.cloud
```

---

## 📊 Contenedores (en ambos servidores)

| **Dominio** | **Contenedor** | **Puerto** | **Base de Datos** |
|-------------|----------------|------------|-------------------|
| `web.siac.com.co` | `odoo-web` | `8073` | `siacdb` |
| `bercont.siac.com.co` | `odoo-bercont` | `8072` | `odoo_bercont` |
| `app.siacshop.com` | `odoo19` | `8069` | `odoo19` |

---

## 🎯 Características Principales

- ✅ **Múltiples servidores:** Soporte para ambos VPS
- ✅ **Protocolo seguro:** Pregunta obligatoria antes de conectar
- ✅ **Documentación completa:** Cobertura de todos los casos de uso
- ✅ **Scripts interactivos:** Gestión automatizada
- ✅ **Comandos de emergencia:** Para situaciones críticas
- ✅ **Verificación completa:** Estado del sistema

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
**Carpeta:** Conexión VPS Mejorada
**Para:** Gestión segura de servidores VPS SIAC

