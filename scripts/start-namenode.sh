#!/bin/bash
# scripts/start-namenode.sh

echo "=== Démarrage du NameNode ==="

# Vérification et formatage de HDFS si nécessaire
if [ ! -d "/hadoop/dfs/name/current" ]; then
    echo "Formatage du système de fichiers HDFS..."
    $HADOOP_HOME/bin/hdfs namenode -format -force -nonInteractive
    echo "HDFS formaté avec succès"
else
    echo "HDFS déjà formaté, pas de formatage nécessaire"
fi

# Démarrage du NameNode
echo "Démarrage du NameNode..."
$HADOOP_HOME/bin/hdfs --daemon start namenode

# Attendre que le NameNode soit opérationnel
echo "Attente du démarrage du NameNode..."
while ! nc -z localhost 9000; do
    echo "En attente du NameNode..."
    sleep 5
done
echo "NameNode opérationnel !"

# Démarrage du ResourceManager
echo "Démarrage du ResourceManager..."
$HADOOP_HOME/bin/yarn --daemon start resourcemanager

# Démarrage du Job History Server
echo "Démarrage du Job History Server..."
$HADOOP_HOME/bin/mapred --daemon start historyserver

# Création des répertoires HDFS de base après un délai
sleep 10
echo "Création des répertoires HDFS..."

# Création des répertoires utilisateur
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /user/root
$HADOOP_HOME/bin/hdfs dfs -chown root:root /user/root

# Création des répertoires pour Spark
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /spark-logs
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /spark-warehouse
$HADOOP_HOME/bin/hdfs dfs -chmod 777 /spark-logs
$HADOOP_HOME/bin/hdfs dfs -chmod 777 /spark-warehouse

# Création des répertoires de données
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /data
$HADOOP_HOME/bin/hdfs dfs -chmod 755 /data

echo "NameNode, ResourceManager et Job History Server démarrés avec succès"

# Maintenir le conteneur en vie
tail -f $HADOOP_HOME/logs/hadoop-root-namenode-*.log

---