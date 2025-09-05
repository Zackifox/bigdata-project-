# dockerfiles/hadoop-base/Dockerfile
FROM ubuntu:20.04

LABEL maintainer="BigData Consultant"
LABEL description="Hadoop Base Image with Java 8 and Hadoop 3.3.6"

ENV DEBIAN_FRONTEND=noninteractive

# Variables d'environnement avec versions mises à jour
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
ENV HADOOP_VERSION=3.3.6
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

# Configuration SSH
RUN ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa && \
    cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys && \
    chmod 0600 ~/.ssh/authorized_keys && \
    echo "Host *" >> ~/.ssh/config && \
    echo "  StrictHostKeyChecking no" >> ~/.ssh/config && \
    echo "  UserKnownHostsFile /dev/null" >> ~/.ssh/config

# Téléchargement et installation de Hadoop avec retry et alternatives
RUN set -e; \
    cd /tmp; \
    # Essayer plusieurs miroirs pour Hadoop
    ( wget -q --timeout=30 --tries=3 https://dlcdn.apache.org/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz || \
      wget -q --timeout=30 --tries=3 https://archive.apache.org/dist/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz || \
      wget -q --timeout=30 --tries=3 https://www.apache.org/dyn/closer.lua/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz?action=download -O hadoop-${HADOOP_VERSION}.tar.gz \
    ); \
    tar -xzf hadoop-${HADOOP_VERSION}.tar.gz; \
    mv hadoop-${HADOOP_VERSION} ${HADOOP_HOME}; \
    rm hadoop-${HADOOP_VERSION}.tar.gz; \
    chown -R root:root $HADOOP_HOME

# Installation d'Apache Pig
ENV PIG_VERSION=0.17.0
ENV PIG_HOME=/opt/pig
RUN set -e; \
    cd /tmp; \
    ( wget -q --timeout=30 --tries=3 https://dlcdn.apache.org/pig/pig-${PIG_VERSION}/pig-${PIG_VERSION}.tar.gz || \
      wget -q --timeout=30 --tries=3 https://archive.apache.org/dist/pig/pig-${PIG_VERSION}/pig-${PIG_VERSION}.tar.gz \
    ); \
    tar -xzf pig-${PIG_VERSION}.tar.gz; \
    mv pig-${PIG_VERSION} ${PIG_HOME}; \
    rm pig-${PIG_VERSION}.tar.gz
ENV PATH=$PATH:$PIG_HOME/bin

# Création des répertoires nécessaires
RUN mkdir -p /hadoop/dfs/name && \
    mkdir -p /hadoop/dfs/data && \
    mkdir -p /hadoop/dfs/namesecondary && \
    mkdir -p $HADOOP_LOG_DIR && \
    mkdir -p /scripts && \
    mkdir -p /data

# Configuration des permissions
RUN chown -R root:root /hadoop && \
    chmod +x $HADOOP_HOME/bin/* && \
    chmod +x $HADOOP_HOME/sbin/*

# Variables d'environnement pour Hadoop
RUN echo "export JAVA_HOME=$JAVA_HOME" >> $HADOOP_CONF_DIR/hadoop-env.sh && \
    echo "export HADOOP_HOME=$HADOOP_HOME" >> $HADOOP_CONF_DIR/hadoop-env.sh && \
    echo "export HADOOP_CONF_DIR=$HADOOP_CONF_DIR" >> $HADOOP_CONF_DIR/hadoop-env.sh

# Configuration SSH
RUN echo 'root:bigdata123' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# Point d'entrée
EXPOSE 9000 9870 8088 9864 9868 19888 10020 8042
WORKDIR /opt/hadoop

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]