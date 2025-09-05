#!/bin/bash
# app/start-app.sh

echo "=== Démarrage de l'application Big Data Dashboard ==="

# Attendre que les services soient disponibles
echo "🔄 Attente des services..."

# Attendre MongoDB
echo "En attente de MongoDB..."
while ! nc -z mongodb 27017; do
    echo "MongoDB non disponible, attente..."
    sleep 5
done
echo "✅ MongoDB disponible"

# Attendre le NameNode
echo "En attente du NameNode..."
while ! nc -z namenode 9870; do
    echo "NameNode non disponible, attente..."
    sleep 5
done
echo "✅ NameNode disponible"

# Attendre Spark Master
echo "En attente du Spark Master..."
while ! nc -z spark-master 8080; do
    echo "Spark Master non disponible, attente..."
    sleep 5
done
echo "✅ Spark Master disponible"

# Installation des dépendances backend si nécessaire
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installation des dépendances backend..."
    cd backend && npm install && cd ..
fi

# Installation des dépendances frontend si elles ne sont pas présentes
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances frontend..."
    npm install
fi

# Création des répertoires nécessaires
mkdir -p logs
mkdir -p data/uploads

echo "🚀 Démarrage des services..."

# Démarrage du serveur backend
echo "🔧 Démarrage du serveur backend..."
cd backend && npm install express cors helmet dotenv mongodb socket.io axios cron fs-extra && cd ..
node backend/server.js &
BACKEND_PID=$!

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 10

# Vérifier si le backend répond
while ! curl -f http://localhost:5000/api/health >/dev/null 2>&1; do
    echo "Backend non prêt, attente..."
    sleep 3
done
echo "✅ Backend prêt"

# Démarrage du frontend React
echo "🎨 Démarrage du frontend React..."
BROWSER=none npm start &
FRONTEND_PID=$!

echo "✅ Application démarrée avec succès!"
echo ""
echo "🌐 Dashboard disponible sur: http://localhost:3000"
echo "🔧 API backend sur: http://localhost:5000"
echo ""
echo "Services externes:"
echo "📊 NameNode Web UI: http://localhost:9870"
echo "⚡ Spark Master UI: http://localhost:8080"
echo "🖥️ YARN ResourceManager: http://localhost:8088"
echo "🗄️ MongoDB: mongodb://localhost:27017"
echo ""

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Application arrêtée"
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGINT SIGTERM

# Surveiller les processus
while true; do
    # Vérifier si le backend est toujours en cours d'exécution
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Le backend s'est arrêté, redémarrage..."
        node backend/server.js &
        BACKEND_PID=$!
    fi
    
    # Vérifier si le frontend est toujours en cours d'exécution
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Le frontend s'est arrêté, redémarrage..."
        BROWSER=none npm start &
        FRONTEND_PID=$!
    fi
    
    sleep 30
done