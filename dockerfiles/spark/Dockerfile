# dockerfiles/spark/Dockerfile
FROM ubuntu:20.04

LABEL maintainer="BigData Consultant"
LABEL description="Apache Spark with Hadoop support"

# Éviter les interactions lors de l'installation
ENV DEBIAN_FRONTEND=noninteractive

# Variables d'environnement avec versions mises à jour
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
ENV SPARK_VERSION=3.4.2
ENV HADOOP_VERSION=3
ENV SPARK_HOME=/opt/spark
ENV SPARK_CONF_DIR=$SPARK_HOME/conf
ENV SPARK_LOG_DIR=$SPARK_HOME/logs
ENV PYTHONPATH=$SPARK_HOME/python:$SPARK_HOME/python/lib/py4j-0.10.9.7-src.zip
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

# Installation des packages Python
RUN pip3 install --no-cache-dir \
    pyspark==3.3.1 \
    numpy \
    pandas \
    matplotlib

# Téléchargement et installation de Spark avec retry et alternatives
RUN set -e; \
    cd /tmp; \
    # Essayer plusieurs miroirs pour Spark
    ( wget -q --timeout=30 --tries=3 https://dlcdn.apache.org/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz || \
      wget -q --timeout=30 --tries=3 https://archive.apache.org/dist/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz || \
      wget -q --timeout=30 --tries=3 https://www.apache.org/dyn/closer.lua/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz?action=download -O spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz \
    ); \
    tar -xzf spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz; \
    mv spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION} ${SPARK_HOME}; \
    rm spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz; \
    chown -R root:root $SPARK_HOME

# Création des répertoires
RUN mkdir -p $SPARK_LOG_DIR && \
    mkdir -p $SPARK_CONF_DIR && \
    mkdir -p /scripts && \
    mkdir -p /data && \
    mkdir -p /tmp/spark-events

# Configuration des permissions
RUN chmod +x $SPARK_HOME/bin/* && \
    chmod +x $SPARK_HOME/sbin/*

# Configuration Spark par défaut
RUN echo "spark.master=spark://spark-master:7077" > $SPARK_CONF_DIR/spark-defaults.conf && \
    echo "spark.sql.adaptive.enabled=true" >> $SPARK_CONF_DIR/spark-defaults.conf

# Variables d'environnement
RUN echo "export JAVA_HOME=$JAVA_HOME" > $SPARK_CONF_DIR/spark-env.sh && \
    echo "export SPARK_HOME=$SPARK_HOME" >> $SPARK_CONF_DIR/spark-env.sh && \
    echo "export PYSPARK_PYTHON=python3" >> $SPARK_CONF_DIR/spark-env.sh

# Point d'entrée
EXPOSE 8080 7077 4040 18080 8081
WORKDIR /opt/spark

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]