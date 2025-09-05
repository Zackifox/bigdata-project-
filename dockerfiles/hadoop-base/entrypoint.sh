#!/bin/bash
# dockerfiles/hadoop-base/entrypoint.sh

set -e

# Démarrage du service SSH
service ssh start

# Configuration des variables d'environnement dynamiques
if [ ! -z "$CORE_CONF_fs_defaultFS" ]; then
    echo "Configuration de fs.defaultFS: $CORE_CONF_fs_defaultFS"
fi

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

# Fonction pour vérifier l'état de HDFS
check_hdfs_status() {
    echo "Vérification de l'état de HDFS..."
    if $HADOOP_HOME/bin/hdfs dfsadmin -report >/dev/null 2>&1; then
        echo "HDFS est opérationnel"
        return 0
    else
        echo "HDFS n'est pas encore opérationnel"
        return 1
    fi
}

# Fonction pour attendre que HDFS soit formaté et disponible
wait_for_hdfs() {
    echo "Attente de la disponibilité de HDFS..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_hdfs_status; then
            return 0
        fi
        attempt=$((attempt + 1))
        echo "Tentative $attempt/$max_attempts - Attente de 10 secondes..."
        sleep 10
    done
    
    echo "Timeout: HDFS n'est pas disponible après $max_attempts tentatives"
    return 1
}

# Création des répertoires HDFS de base (si c'est le NameNode)
create_hdfs_directories() {
    echo "Création des répertoires HDFS de base..."
    
    # Création du répertoire utilisateur
    $HADOOP_HOME/bin/hdfs dfs -mkdir -p /user/root
    $HADOOP_HOME/bin/hdfs dfs -chown root:root /user/root
    
    # Création du répertoire pour les données
    $HADOOP_HOME/bin/hdfs dfs -mkdir -p /data
    $HADOOP_HOME/bin/hdfs dfs -chmod 755 /data
    
    # Création du répertoire pour Pig
    $HADOOP_HOME/bin/hdfs dfs -mkdir -p /pig
    $HADOOP_HOME/bin/hdfs dfs -chmod 755 /pig
    
    # Création du répertoire pour les logs
    $HADOOP_HOME/bin/hdfs dfs -mkdir -p /logs
    $HADOOP_HOME/bin/hdfs dfs -chmod 755 /logs
    
    echo "Répertoires HDFS créés avec succès"
}

# Configuration des logs
mkdir -p $HADOOP_LOG_DIR
touch $HADOOP_LOG_DIR/hadoop-root-namenode.log
touch $HADOOP_LOG_DIR/hadoop-root-datanode.log
touch $HADOOP_LOG_DIR/yarn-root-resourcemanager.log
touch $HADOOP_LOG_DIR/yarn-root-nodemanager.log

echo "=== Démarrage du conteneur Hadoop ==="
echo "JAVA_HOME: $JAVA_HOME"
echo "HADOOP_HOME: $HADOOP_HOME"
echo "HADOOP_CONF_DIR: $HADOOP_CONF_DIR"
echo "Container hostname: $(hostname)"
echo "Container IP: $(hostname -I)"
echo "========================================="

# Exécution de la commande passée en paramètre
exec "$@"