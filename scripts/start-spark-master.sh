#!/bin/bash
# scripts/start-spark-master.sh

echo "=== Démarrage du Spark Master ==="

# Attendre que le NameNode soit disponible (pour HDFS)
echo "Attente du NameNode pour HDFS..."
while ! nc -z namenode 9000; do
    echo "En attente du NameNode..."
    sleep 5
done
echo "NameNode accessible !"

# Démarrage du Spark Master
echo "Démarrage du Spark Master..."
$SPARK_HOME/sbin/start-master.sh

# Démarrage du Spark History Server
echo "Démarrage du Spark History Server..."
$SPARK_HOME/sbin/start-history-server.sh

echo "Spark Master et History Server démarrés avec succès"
echo "Interface Web disponible sur http://localhost:8080"

# Maintenir le conteneur en vie
tail -f $SPARK_HOME/logs/spark-root-org.apache.spark.deploy.master.Master-*.out

---
