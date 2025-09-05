#!/bin/bash
# scripts/setup-environment.sh

echo "=== Configuration de l'environnement Big Data ==="

# Attendre que tous les services soient opérationnels
echo "Vérification de l'état des services..."

# Vérification HDFS
while ! $HADOOP_HOME/bin/hdfs dfsadmin -report >/dev/null 2>&1; do
    echo "En attente de HDFS..."
    sleep 10
done
echo "✓ HDFS opérationnel"

# Vérification YARN
while ! $HADOOP_HOME/bin/yarn node -list >/dev/null 2>&1; do
    echo "En attente de YARN..."
    sleep 10
done
echo "✓ YARN opérationnel"

# Upload des données d'exemple
echo "Upload des fichiers de données d'exemple..."

# Création des répertoires
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /data/input
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /data/output
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /pig/scripts
$HADOOP_HOME/bin/hdfs dfs -mkdir -p /pig/output

# Copier les scripts Pig
if [ -d "/scripts/pig" ]; then
    $HADOOP_HOME/bin/hdfs dfs -put /scripts/pig/* /pig/scripts/
    echo "✓ Scripts Pig uploadés"
fi

# Copier les données d'exemple
if [ -d "/data/sample" ]; then
    $HADOOP_HOME/bin/hdfs dfs -put /data/sample/* /data/input/
    echo "✓ Données d'exemple uploadées"
fi

echo "=== Configuration terminée ==="
