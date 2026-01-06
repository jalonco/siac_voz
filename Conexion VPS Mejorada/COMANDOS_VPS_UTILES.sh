#!/bin/bash

# =============================================================================
# COMANDOS ÚTILES PARA GESTIÓN DEL SERVIDOR VPS - SIAC
# =============================================================================

# Configuración
VPS_HOST="srv790515.hstgr.cloud"
SSH_KEY="~/.ssh/id_ed25519"
SSH_CMD="ssh -i $SSH_KEY root@$VPS_HOST"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# FUNCIONES DE VERIFICACIÓN
# =============================================================================

verificar_conexion() {
    echo -e "${BLUE}=== VERIFICANDO CONEXIÓN AL VPS ===${NC}"
    $SSH_CMD "echo 'Servidor: $VPS_HOST' && echo 'Usuario: root' && echo 'Fecha: $(date)' && echo 'Estado: Conectado'"
}

verificar_contenedores() {
    echo -e "${BLUE}=== ESTADO DE CONTENEDORES ODOO ===${NC}"
    $SSH_CMD "docker ps | grep odoo"
}

verificar_dominios() {
    echo -e "${BLUE}=== VERIFICACIÓN DE DOMINIOS ===${NC}"
    echo -e "${YELLOW}--- WEB.SIAC.COM.CO ---${NC}"
    $SSH_CMD "curl -I https://web.siac.com.co 2>/dev/null | head -3"
    echo -e "${YELLOW}--- BERCONT.SIAC.COM.CO ---${NC}"
    $SSH_CMD "curl -I https://bercont.siac.com.co 2>/dev/null | head -3"
    echo -e "${YELLOW}--- APP.SIACSHOP.COM ---${NC}"
    $SSH_CMD "curl -I https://app.siacshop.com 2>/dev/null | head -3"
}

verificar_modulos() {
    echo -e "${BLUE}=== MÓDULOS INSTALADOS ===${NC}"
    echo -e "${YELLOW}--- WEB.SIAC.COM.CO ---${NC}"
    $SSH_CMD "docker exec odoo-web-db psql -U odoo -d siacdb -c \"SELECT name, state FROM ir_module_module WHERE name LIKE '%branding%' OR name LIKE '%siac%';\""
    echo -e "${YELLOW}--- BERCONT.SIAC.COM.CO ---${NC}"
    $SSH_CMD "docker exec odoo-bercont-db psql -U odoo -d odoo_bercont -c \"SELECT name, state FROM ir_module_module WHERE name LIKE '%branding%' OR name LIKE '%siac%';\""
    echo -e "${YELLOW}--- APP.SIACSHOP.COM ---${NC}"
    $SSH_CMD "docker exec odoo19-db psql -U odoo -d odoo19 -c \"SELECT name, state FROM ir_module_module WHERE name LIKE '%branding%' OR name LIKE '%siac%';\""
}

# =============================================================================
# FUNCIONES DE GESTIÓN DE CONTENEDORES
# =============================================================================

reiniciar_contenedor() {
    local contenedor=$1
    echo -e "${BLUE}=== REINICIANDO CONTENEDOR: $contenedor ===${NC}"
    $SSH_CMD "docker restart $contenedor"
    echo -e "${GREEN}Contenedor $contenedor reiniciado${NC}"
}

reiniciar_todos() {
    echo -e "${BLUE}=== REINICIANDO TODOS LOS CONTENEDORES ODOO ===${NC}"
    $SSH_CMD "docker restart odoo-web odoo-web-db odoo-bercont odoo-bercont-db odoo19 odoo19-db"
    echo -e "${GREEN}Todos los contenedores reiniciados${NC}"
}

ver_logs() {
    local contenedor=$1
    local lineas=${2:-50}
    echo -e "${BLUE}=== LOGS DEL CONTENEDOR: $contenedor ===${NC}"
    $SSH_CMD "docker logs $contenedor --tail $lineas"
}

# =============================================================================
# FUNCIONES DE GESTIÓN DE MÓDULOS
# =============================================================================

instalar_modulo() {
    local modulo=$1
    local contenedor=${2:-"odoo-web"}
    local base_datos=""
    
    case $contenedor in
        "odoo-web")
            base_datos="siacdb"
            ;;
        "odoo-bercont")
            base_datos="odoo_bercont"
            ;;
        "odoo19")
            base_datos="odoo19"
            ;;
        *)
            echo -e "${RED}Contenedor no válido. Use: odoo-web, odoo-bercont, odoo19${NC}"
            return 1
            ;;
    esac
    
    echo -e "${BLUE}=== INSTALANDO MÓDULO: $modulo EN $contenedor ===${NC}"
    
    # Copiar módulo
    $SSH_CMD "cp -r /root/common_addons/$modulo /opt/$contenedor/addons/"
    echo -e "${GREEN}Módulo copiado${NC}"
    
    # Actualizar versión
    $SSH_CMD "sed -i 's/18.0.1.0.0/19.0.1.0.0/g' /opt/$contenedor/addons/$modulo/__manifest__.py"
    echo -e "${GREEN}Versión actualizada${NC}"
    
    # Instalar módulo
    $SSH_CMD "docker exec $contenedor python3 /usr/bin/odoo -d $base_datos --stop-after-init --no-http -i $modulo"
    echo -e "${GREEN}Módulo instalado${NC}"
}

# =============================================================================
# FUNCIONES DE BASE DE DATOS
# =============================================================================

acceder_bd() {
    local contenedor=$1
    echo -e "${BLUE}=== ACCEDIENDO A BASE DE DATOS: $contenedor ===${NC}"
    $SSH_CMD "docker exec -it $contenedor psql -U odoo -d $(echo $contenedor | sed 's/-db//')"
}

crear_usuario() {
    local contenedor=$1
    local usuario=$2
    local password=$3
    local base_datos=""
    
    case $contenedor in
        "odoo-web-db")
            base_datos="siacdb"
            ;;
        "odoo-bercont-db")
            base_datos="odoo_bercont"
            ;;
        "odoo19-db")
            base_datos="odoo19"
            ;;
        *)
            echo -e "${RED}Contenedor de BD no válido${NC}"
            return 1
            ;;
    esac
    
    echo -e "${BLUE}=== CREANDO USUARIO: $usuario EN $base_datos ===${NC}"
    $SSH_CMD "docker exec $contenedor psql -U odoo -d $base_datos -c \"INSERT INTO res_users (login, password, active, company_id, create_date, write_date) VALUES ('$usuario', '$password', true, 1, NOW(), NOW()) RETURNING id;\""
}

# =============================================================================
# FUNCIONES DE MONITOREO
# =============================================================================

estado_sistema() {
    echo -e "${BLUE}=== ESTADO DEL SISTEMA ===${NC}"
    $SSH_CMD "echo '=== CONTENEDORES ===' && docker ps && echo '=== ESPACIO EN DISCO ===' && df -h && echo '=== MEMORIA ===' && free -h && echo '=== CPU ===' && top -bn1 | head -5"
}

backup_bd() {
    local contenedor=$1
    local base_datos=$2
    local fecha=$(date +%Y%m%d-%H%M%S)
    
    echo -e "${BLUE}=== CREANDO BACKUP DE $base_datos ===${NC}"
    $SSH_CMD "mkdir -p /backups/$fecha"
    $SSH_CMD "docker exec $contenedor pg_dump -U odoo $base_datos > /backups/$fecha/${base_datos}_backup.sql"
    echo -e "${GREEN}Backup creado en /backups/$fecha/${base_datos}_backup.sql${NC}"
}

# =============================================================================
# MENÚ PRINCIPAL
# =============================================================================

mostrar_menu() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  GESTIÓN SERVIDOR VPS - SIAC${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "1. Verificar conexión"
    echo "2. Verificar contenedores"
    echo "3. Verificar dominios"
    echo "4. Verificar módulos"
    echo "5. Reiniciar contenedor específico"
    echo "6. Reiniciar todos los contenedores"
    echo "7. Ver logs de contenedor"
    echo "8. Instalar módulo"
    echo "9. Acceder a base de datos"
    echo "10. Crear usuario"
    echo "11. Estado del sistema"
    echo "12. Crear backup"
    echo "0. Salir"
    echo -e "${GREEN}========================================${NC}"
}

# =============================================================================
# EJECUCIÓN DEL SCRIPT
# =============================================================================

if [ $# -eq 0 ]; then
    mostrar_menu
    read -p "Seleccione una opción: " opcion
    
    case $opcion in
        1) verificar_conexion ;;
        2) verificar_contenedores ;;
        3) verificar_dominios ;;
        4) verificar_modulos ;;
        5) 
            read -p "Nombre del contenedor: " contenedor
            reiniciar_contenedor $contenedor
            ;;
        6) reiniciar_todos ;;
        7) 
            read -p "Nombre del contenedor: " contenedor
            read -p "Número de líneas (default 50): " lineas
            ver_logs $contenedor $lineas
            ;;
        8) 
            read -p "Nombre del módulo: " modulo
            read -p "Contenedor (odoo-web/odoo-bercont/odoo19): " contenedor
            instalar_modulo $modulo $contenedor
            ;;
        9) 
            read -p "Contenedor de BD: " contenedor
            acceder_bd $contenedor
            ;;
        10) 
            read -p "Contenedor de BD: " contenedor
            read -p "Usuario: " usuario
            read -p "Contraseña: " password
            crear_usuario $contenedor $usuario $password
            ;;
        11) estado_sistema ;;
        12) 
            read -p "Contenedor de BD: " contenedor
            read -p "Base de datos: " base_datos
            backup_bd $contenedor $base_datos
            ;;
        0) echo "Saliendo..." ; exit 0 ;;
        *) echo "Opción no válida" ;;
    esac
else
    # Ejecutar función directamente
    $@
fi
