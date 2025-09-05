#!/bin/bash
# deploy.sh - Script de déploiement principal pour le projet Big Data

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage des messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé. Veuillez installer Docker."
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose."
        exit 1
    fi
    
    # Vérifier les ressources système
    TOTAL_RAM=$(free -g | grep "^Mem:" | awk '{print $2}')
    if [ "$TOTAL_RAM" -lt 8 ]; then
        log_warning "RAM détectée: ${TOTAL_RAM}GB. Recommandé: 16GB minimum."
        read -p "Continuer malgré tout? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Vérifier l'espace disque
    AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 50 ]; then
        log_warning "Espace disque disponible: ${AVAILABLE_SPACE}GB. Recommandé: 100GB minimum."
        read -p "Continuer malgré tout? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction pour créer la structure des répertoires
create_directory_structure() {
    log_info "Création de la structure des répertoires..."
    
    mkdir -p {config/{hadoop,spark},scripts/{pig,mongodb},data/sample,app/{src/components,backend}}
    mkdir -p dockerfiles/{hadoop-base,spark,mongodb}
    
    log_success "Structure des répertoires créée"
}

# Fonction pour rendre les scripts exécutables
make_scripts_executable() {
    log_info "Définition des permissions..."
    
    find . -name "*.sh" -type f -exec chmod +x {} \;
    find dockerfiles/ -name "entrypoint.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
    
    log_success "Permissions définies"
}

# Fonction pour vérifier les ports
check_ports() {
    log_info "Vérification des ports requis..."
    
    REQUIRED_PORTS=(3000 5000 8080 8081 8082 8083 8088 9000 9864 9865 9866 9868 9870 19888 27017)
    BUSY_PORTS=()
    
    for port in "${REQUIRED_PORTS[@]}"; do
        if ss -tuln | grep -q ":$port "; then
            BUSY_PORTS+=($port)
        fi
    done
    
    if [ ${#BUSY_PORTS[@]} -gt 0 ]; then
        log_warning "Ports occupés détectés: ${BUSY_PORTS[*]}"
        log_warning "Ces services pourraient ne pas démarrer correctement."
        read -p "Continuer malgré tout? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Vérification des ports terminée"
}

# Fonction de construction des images
build_images() {
    log_info "Construction des images Docker..."
    
    if ! docker-compose build; then
        log_error "Échec de la construction des images"
        exit 1
    fi
    
    log_success "Images construites avec succès"
}

# Fonction de démarrage des services
start_services() {
    log_info "Démarrage des services..."
    
    # Démarrer les services en arrière-plan
    docker-compose up -d
    
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier l'état des services
    if docker-compose ps | grep -q "Exit"; then
        log_error "Certains services ne ont pas démarré correctement"
        docker-compose ps
        log_info "Vérifiez les logs avec: docker-compose logs [service]"
        exit 1
    fi
    
    log_success "Services démarrés"
}

# Fonction de vérification de la santé des services
health_check() {
    log_info "Vérification de la santé des services..."
    
    local max_attempts=30
    local attempt=1
    
    # Services à vérifier
    declare -A services=(
        ["NameNode"]="http://localhost:9870"
        ["ResourceManager"]="http://localhost:8088"
        ["Spark Master"]="http://localhost:8080"
        ["Application"]="http://localhost:3000"
    )
    
    for service_name in "${!services[@]}"; do
        local url="${services[$service_name]}"
        log_info "Vérification de $service_name..."
        
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s "$url" > /dev/null 2>&1; then
                log_success "$service_name est opérationnel"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "$service_name n'est pas accessible après $max_attempts tentatives"
                log_info "URL testée: $url"
            else
                echo -n "."
                sleep 5
            fi
            
            ((attempt++))
        done
    done
    
    log_success "Vérification de santé terminée"
}

# Fonction de test des fonctionnalités
test_functionality() {
    log_info "Test des fonctionnalités de base..."
    
    # Test HDFS
    log_info "Test HDFS..."
    if docker exec namenode hdfs dfs -ls / > /dev/null 2>&1; then
        log_success "HDFS fonctionne"
    else
        log_warning "HDFS pourrait avoir des problèmes"
    fi
    
    # Test MongoDB
    log_info "Test MongoDB..."
    if docker exec mongodb mongo --quiet --eval "db.stats()" bigdata > /dev/null 2>&1; then
        log_success "MongoDB fonctionne"
    else
        log_warning "MongoDB pourrait avoir des problèmes"
    fi
    
    log_success "Tests de fonctionnalité terminés"
}

# Fonction pour afficher les informations de connexion
show_connection_info() {
    log_success "🎉 Déploiement terminé avec succès!"
    echo
    echo "==============================================="
    echo "           INFORMATIONS DE CONNEXION"
    echo "==============================================="
    echo
    echo "🌐 Dashboard Principal:"
    echo "   http://localhost:3000"
    echo
    echo "🔧 Interfaces d'Administration:"
    echo "   NameNode (HDFS):      http://localhost:9870"
    echo "   ResourceManager:      http://localhost:8088"
    echo "   Spark Master:         http://localhost:8080"
    echo "   Job History Server:   http://localhost:19888"
    echo
    echo "🗄️ Base de Données:"
    echo "   MongoDB:              mongodb://localhost:27017"
    echo "   Utilisateur:          admin"
    echo "   Mot de passe:         bigdata123"
    echo
    echo "🔍 API Backend:"
    echo "   URL:                  http://localhost:5000"
    echo "   Health Check:         http://localhost:5000/api/health"
    echo
    echo "==============================================="
    echo "           COMMANDES UTILES"
    echo "==============================================="
    echo
    echo "📊 Voir les logs:"
    echo "   docker-compose logs -f [service]"
    echo
    echo "🔄 Redémarrer un service:"
    echo "   docker-compose restart [service]"
    echo
    echo "⏹️ Arrêter tous les services:"
    echo "   docker-compose down"
    echo
    echo "🧹 Nettoyage complet:"
    echo "   docker-compose down -v && docker system prune -f"
    echo
    echo "==============================================="
}

# Fonction de nettoyage
cleanup() {
    log_info "Nettoyage en cours..."
    docker-compose down 2>/dev/null || true
}

# Fonction principale
main() {
    echo "==============================================="
    echo "    DÉPLOIEMENT PROJET BIG DATA HADOOP/SPARK"
    echo "==============================================="
    echo
    
    # Gestion des signaux
    trap cleanup EXIT
    
    check_prerequisites
    create_directory_structure
    make_scripts_executable
    check_ports
    
    log_info "Début du déploiement..."
    
    build_images
    start_services
    health_check
    test_functionality
    
    show_connection_info
    
    # Maintenir le script en vie pour surveiller
    log_info "Le cluster est maintenant opérationnel. Appuyez sur Ctrl+C pour arrêter."
    
    while true; do
        sleep 60
        # Vérification périodique simple
        if ! docker-compose ps | grep -q "Up"; then
            log_warning "Certains services semblent être arrêtés"
            docker-compose ps
        fi
    done
}

# Gestion des options de ligne de commande
case "${1:-}" in
    "start")
        start_services
        ;;
    "stop")
        log_info "Arrêt des services..."
        docker-compose down
        log_success "Services arrêtés"
        ;;
    "restart")
        log_info "Redémarrage des services..."
        docker-compose restart
        log_success "Services redémarrés"
        ;;
    "clean")
        log_info "Nettoyage complet..."
        docker-compose down -v
        docker system prune -f
        log_success "Nettoyage terminé"
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "status")
        docker-compose ps
        health_check
        ;;
    "help")
        echo "Usage: $0 [start|stop|restart|clean|logs|status|help]"
        echo
        echo "  start   - Démarre les services"
        echo "  stop    - Arrête les services" 
        echo "  restart - Redémarre les services"
        echo "  clean   - Nettoyage complet"
        echo "  logs    - Affiche les logs (optionnel: nom du service)"
        echo "  status  - Affiche le statut des services"
        echo "  help    - Affiche cette aide"
        echo
        echo "Sans argument: déploiement complet"
        ;;
    *)
        main
        ;;
esac