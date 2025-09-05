# app/Dockerfile
FROM node:16-alpine

LABEL maintainer="BigData Consultant"
LABEL description="Big Data Dashboard Application"

# Installation des dépendances système
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    bash

# Installation de packages Python pour les scripts backend
RUN pip3 install --no-cache-dir \
    pymongo \
    pandas \
    numpy \
    flask \
    flask-cors \
    requests

# Répertoire de travail
WORKDIR /app

# Copie des fichiers package.json
COPY package*.json ./

# Installation des dépendances Node.js
RUN npm install

# Copie du code source
COPY . .

# Build de l'application React (en mode développement pour ce projet)
ENV NODE_ENV=development

# Exposition des ports
EXPOSE 3000 5000

# Script de démarrage
COPY start-app.sh /start-app.sh
RUN chmod +x /start-app.sh

CMD ["/start-app.sh"]