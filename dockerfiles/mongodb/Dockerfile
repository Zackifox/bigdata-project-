# dockerfiles/mongodb/Dockerfile
FROM mongo:5.0

LABEL maintainer="BigData Consultant"
LABEL description="MongoDB optimized for Big Data workloads"

# Installation des outils supplémentaires
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    wget \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Installation de pymongo et autres packages Python
RUN pip3 install --no-cache-dir \
    pymongo \
    pandas \
    numpy \
    faker

# Configuration MongoDB pour Big Data
RUN mkdir -p /etc/mongo-init

# Script d'initialisation personnalisé
COPY init-bigdata.js /docker-entrypoint-initdb.d/
COPY generate-sample-data.py /etc/mongo-init/

# Configuration MongoDB optimisée
COPY mongod.conf /etc/mongod.conf

# Exposition des ports
EXPOSE 27017

# Commande par défaut
CMD ["mongod", "--config", "/etc/mongod.conf"]