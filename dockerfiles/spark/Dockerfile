# dockerfiles/spark/Dockerfile
FROM ubuntu:20.04

LABEL maintainer="BigData Consultant"
LABEL description="Apache Spark with Hadoop support"

# Éviter les interactions lors de l'installation
ENV DEBIAN_FRONTEND=noninteractive

# Variables d'environnement
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
ENV SPARK_VERSION=3.3.1
ENV HADOOP_VERSION=3.3
ENV SPARK_HOME=/opt/spark
ENV SPARK_CONF_DIR=$SPARK_HOME/conf
ENV SPARK_LOG_DIR=$SPARK_HOME/logs
ENV PYTHONPATH=$SPARK_HOME/python:$SPARK_HOME/python/lib/py4j-0.10.9.5-src.zip
ENV PATH=$PATH:$SPARK_HOME/bin:$SPARK_HOME/sbin:$JAVA_HOME/bin

# Installation des packages de base
RUN apt-get update && apt-get install -y \
    openjdk-8-jdk \
    wget \
    curl \
    python3 \
    python3-pip \
    scala \
    vim \
    net-tools \
    iputils-ping \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Installation de Python packages pour PySpark
RUN pip3 install --no-cache-dir \
    pyspark==3.3.1 \
    numpy \
    pandas \
    matplotlib \
    seaborn \
    jupyter \
    pymongo

# Téléchargement et installation de Spark
RUN wget -q https://archive.apache.org/dist/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz && \
    tar -xzf spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz && \
    mv spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION} ${SPARK_HOME} && \
    rm spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz

# Installation du MongoDB Spark Connector
RUN wget -q https://repo1.maven.org/maven2/org/mongodb/spark/mongo-spark-connector_2.12/3.0.2/mongo-spark-connector_2.12-3.0.2.jar -P $SPARK_HOME/jars/ && \
    wget -q https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-sync/4.3.4/mongodb-driver-sync-4.3.4.jar -P $SPARK_HOME/jars/ && \
    wget -q https://repo1.maven.org/maven2/org/mongodb/bson/4.3.4/bson-4.3.4.jar -P $SPARK_HOME/jars/ && \
    wget -q https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-core/4.3.4/mongodb-driver-core-4.3.4.jar -P $SPARK_HOME/jars/

# Création des répertoires nécessaires
RUN mkdir -p $SPARK_LOG_DIR && \
    mkdir -p $SPARK_CONF_DIR && \
    mkdir -p /scripts && \
    mkdir -p /data && \
    mkdir -p /tmp/spark-events

# Configuration des permissions
RUN chown -R root:root $SPARK_HOME && \
    chmod +x $SPARK_HOME/bin/* && \
    chmod +x $SPARK_HOME/sbin/*

# Configuration Spark par défaut
RUN echo "spark.master=spark://spark-master:7077" > $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.sql.adaptive.enabled=true" >> $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.sql.adaptive.coalescePartitions.enabled=true" >> $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.sql.warehouse.dir=hdfs://namenode:9000/spark-warehouse" >> $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.eventLog.enabled=true" >> $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.eventLog.dir=hdfs://namenode:9000/spark-logs" >> $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.history.fs.logDirectory=hdfs://namenode:9000/spark-logs" >> $SPARK_CONF_DIR/spark-defaults.conf

# Variables d'environnement pour Spark
RUN echo "export JAVA_HOME=$JAVA_HOME" > $SPARK_CONF_DIR/spark-env.sh && \
    echo "export SPARK_HOME=$SPARK_HOME" >> $SPARK_CONF_DIR/spark-env.sh && \
    echo "export SPARK_CONF_DIR=$SPARK_CONF_DIR" >> $SPARK_CONF_DIR/spark-env.sh && \
    echo "export SPARK_LOG_DIR=$SPARK_LOG_DIR" >> $SPARK_CONF_DIR/spark-env.sh && \
    echo "export PYSPARK_PYTHON=python3" >> $SPARK_CONF_DIR/spark-env.sh && \
    echo "export PYTHONPATH=$PYTHONPATH" >> $SPARK_CONF_DIR/spark-env.sh

# Configuration des workers
RUN echo "spark-worker1" > $SPARK_CONF_DIR/workers && \
    echo "spark-worker2" >> $SPARK_CONF_DIR/workers && \
    echo "spark-worker3" >> $SPARK_CONF_DIR/workers

# Exposition des ports
EXPOSE 8080 7077 4040 18080 8081

# Point d'entrée
WORKDIR /opt/spark

# Script de démarrage
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]