#!/bin/bash
# dockerfiles/spark/entrypoint.sh

set -e

# Fonction pour attendre qu'un service soit disponible
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    
    echo "Attente de $service_name à $host:$port..."
    while ! nc -z $host $port; do
        echo "En attente de $service_name..."
        sleep 2
    done
    echo "$service_name est disponible !"
}

# Fonction pour attendre le Spark Master
wait_for_spark_master() {
    if [ "$SPARK_MODE" = "worker" ]; then
        echo "Attente du Spark Master..."
        # Extraire l'host et le port de SPARK_MASTER_URL
        local master_host=$(echo $SPARK_MASTER_URL | cut -d'/' -f3 | cut -d':' -f1)
        local master_port=$(echo $SPARK_MASTER_URL | cut -d'/' -f3 | cut -d':' -f2)
        wait_for_service $master_host $master_port "Spark Master"
    fi
}

# Configuration des logs
mkdir -p $SPARK_LOG_DIR
touch $SPARK_LOG_DIR/spark-master.log
touch $SPARK_LOG_DIR/spark-worker.log

echo "=== Démarrage du conteneur Spark ==="
echo "JAVA_HOME: $JAVA_HOME"
echo "SPARK_HOME: $SPARK_HOME"
echo "SPARK_CONF_DIR: $SPARK_CONF_DIR"
echo "SPARK_MODE: $SPARK_MODE"
echo "Container hostname: $(hostname)"
echo "Container IP: $(hostname -I)"
echo "======================================="

# Attendre les dépendances si nécessaire
wait_for_spark_master

# Exécution de la commande passée en paramètre
exec "$@"