#!/bin/bash
# scripts/start-spark-worker.sh

echo "=== Démarrage du Spark Worker ==="

# Attendre que le Spark Master soit disponible
echo "Attente du Spark Master..."
master_host=$(echo $SPARK_MASTER_URL | cut -d'/' -f3 | cut -d':' -f1)
master_port=$(echo $SPARK_MASTER_URL | cut -d'/' -f3 | cut -d':' -f2)

while ! nc -z $master_host $master_port; do
    echo "En attente du Spark Master à $master_host:$master_port..."
    sleep 5
done
echo "Spark Master accessible !"

# Démarrage du Spark Worker
echo "Démarrage du Spark Worker..."
echo "Master URL: $SPARK_MASTER_URL"
echo "Worker Cores: $SPARK_WORKER_CORES"
echo "Worker Memory: $SPARK_WORKER_MEMORY"

$SPARK_HOME/sbin/start-worker.sh $SPARK_MASTER_URL

echo "Spark Worker démarré avec succès"

# Maintenir le conteneur en vie
tail -f $SPARK_HOME/logs/spark-root-org.apache.spark.deploy.worker.Worker-*.out

---
