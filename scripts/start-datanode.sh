#!/bin/bash
# scripts/start-datanode.sh

echo "=== Démarrage du DataNode ==="

# Attendre que le NameNode soit disponible
echo "Attente du NameNode..."
while ! nc -z namenode 9000; do
    echo "En attente du NameNode..."
    sleep 5
done
echo "NameNode accessible !"

# Démarrage du DataNode
echo "Démarrage du DataNode..."
$HADOOP_HOME/bin/hdfs --daemon start datanode

# Démarrage du NodeManager
echo "Démarrage du NodeManager..."
$HADOOP_HOME/bin/yarn --daemon start nodemanager

echo "DataNode et NodeManager démarrés avec succès"

# Maintenir le conteneur en vie
tail -f $HADOOP_HOME/logs/hadoop-root-datanode-*.log

---

#!/bin/bash
# scripts/start-secondarynamenode.sh

echo "=== Démarrage du Secondary NameNode ==="

# Attendre que le NameNode soit disponible
echo "Attente du NameNode..."
while ! nc -z namenode 9000; do
    echo "En attente du NameNode..."
    sleep 5
done
echo "NameNode accessible !"

# Démarrage du Secondary NameNode
echo "Démarrage du Secondary NameNode..."
$HADOOP_HOME/bin/hdfs --daemon start secondarynamenode

echo "Secondary NameNode démarré avec succès"

# Maintenir le conteneur en vie
tail -f $HADOOP_HOME/logs/hadoop-root-secondarynamenode-*.log

---