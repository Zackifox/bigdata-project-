# dockerfiles/hadoop-base/Dockerfile
FROM ubuntu:20.04

LABEL maintainer="BigData Consultant"
LABEL description="Hadoop Base Image with Java 8 and Hadoop 3.3.4"

# Éviter les interactions lors de l'installation
ENV DEBIAN_FRONTEND=noninteractive

# Variables d'environnement
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
ENV HADOOP_VERSION=3.3.4
ENV HADOOP_HOME=/opt/hadoop
ENV HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
ENV HADOOP_LOG_DIR=$HADOOP_HOME/logs
ENV YARN_LOG_DIR=$HADOOP_LOG_DIR
ENV PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$JAVA_HOME/bin

# Installation des packages de base
RUN apt-get update && apt-get install -y \
    openjdk-8-jdk \
    wget \
    curl \
    ssh \
    openssh-server \
    openssh-client \
    rsync \
    vim \
    net-tools \
    iputils-ping \
    python3 \
    python3-pip \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Configuration SSH pour Hadoop
RUN ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa && \
    cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys && \
    chmod 0600 ~/.ssh/authorized_keys && \
    echo "Host *" >> ~/.ssh/config && \
    echo "  StrictHostKeyChecking no" >> ~/.ssh/config && \
    echo "  UserKnownHostsFile /dev/null" >> ~/.ssh/config

# Téléchargement et installation de Hadoop
RUN wget -q https://archive.apache.org/dist/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz && \
    tar -xzf hadoop-${HADOOP_VERSION}.tar.gz && \
    mv hadoop-${HADOOP_VERSION} ${HADOOP_HOME} && \
    rm hadoop-${HADOOP_VERSION}.tar.gz

# Installation d'Apache Pig
ENV PIG_VERSION=0.17.0
ENV PIG_HOME=/opt/pig
RUN wget -q https://archive.apache.org/dist/pig/pig-${PIG_VERSION}/pig-${PIG_VERSION}.tar.gz && \
    tar -xzf pig-${PIG_VERSION}.tar.gz && \
    mv pig-${PIG_VERSION} ${PIG_HOME} && \
    rm pig-${PIG_VERSION}.tar.gz
ENV PATH=$PATH:$PIG_HOME/bin

# Installation du MongoDB Hadoop Connector
RUN wget -q https://repo1.maven.org/maven2/org/mongodb/mongo-hadoop/mongo-hadoop-core/2.0.2/mongo-hadoop-core-2.0.2.jar -P $HADOOP_HOME/share/hadoop/common/lib/ && \
    wget -q https://repo1.maven.org/maven2/org/mongodb/mongodb-driver/3.12.11/mongodb-driver-3.12.11.jar -P $HADOOP_HOME/share/hadoop/common/lib/ && \
    wget -q https://repo1.maven.org/maven2/org/mongodb/bson/3.12.11/bson-3.12.11.jar -P $HADOOP_HOME/share/hadoop/common/lib/ && \
    wget -q https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-core/3.12.11/mongodb-driver-core-3.12.11.jar -P $HADOOP_HOME/share/hadoop/common/lib/

# Création des répertoires nécessaires
RUN mkdir -p /hadoop/dfs/name && \
    mkdir -p /hadoop/dfs/data && \
    mkdir -p /hadoop/dfs/namesecondary && \
    mkdir -p $HADOOP_LOG_DIR && \
    mkdir -p /scripts && \
    mkdir -p /data

# Configuration des permissions
RUN chown -R root:root $HADOOP_HOME && \
    chown -R root:root /hadoop && \
    chmod +x $HADOOP_HOME/bin/* && \
    chmod +x $HADOOP_HOME/sbin/*

# Configuration Hadoop par défaut
RUN echo '<?xml version="1.0" encoding="UTF-8"?>' > $HADOOP_CONF_DIR/core-site.xml && \
    echo '<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>' >> $HADOOP_CONF_DIR/core-site.xml && \
    echo '<configuration>' >> $HADOOP_CONF_DIR/core-site.xml && \
    echo '</configuration>' >> $HADOOP_CONF_DIR/core-site.xml

# Variables d'environnement pour Hadoop
RUN echo "export JAVA_HOME=$JAVA_HOME" >> $HADOOP_CONF_DIR/hadoop-env.sh && \
    echo "export HADOOP_HOME=$HADOOP_HOME" >> $HADOOP_CONF_DIR/hadoop-env.sh && \
    echo "export HADOOP_CONF_DIR=$HADOOP_CONF_DIR" >> $HADOOP_CONF_DIR/hadoop-env.sh && \
    echo "export HADOOP_LOG_DIR=$HADOOP_LOG_DIR" >> $HADOOP_CONF_DIR/hadoop-env.sh

# Configuration du service SSH
RUN echo 'root:bigdata123' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Exposition des ports
EXPOSE 9000 9870 8088 9864 9868 19888 10020 8042 8188

# Point d'entrée
WORKDIR /opt/hadoop

# Script de démarrage par défaut
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]