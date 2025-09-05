// app/backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cron = require('cron');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:bigdata123@mongodb:27017/bigdata?authSource=admin';
let mongoClient;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
async function connectToMongo() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connexion à MongoDB réussie');
    return mongoClient.db('bigdata');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    return null;
  }
}

// Fonction pour vérifier le statut des services
async function checkServiceStatus() {
  const status = {
    hdfs: 'offline',
    yarn: 'offline',
    spark: 'offline',
    mongodb: 'offline',
    timestamp: new Date()
  };

  try {
    // Vérification HDFS
    const hdfsResponse = await axios.get('http://namenode:9870/jmx?qry=Hadoop:service=NameNode,name=NameNodeStatus', { timeout: 5000 });
    status.hdfs = hdfsResponse.status === 200 ? 'online' : 'offline';
  } catch (error) {
    status.hdfs = 'error';
  }

  try {
    // Vérification YARN
    const yarnResponse = await axios.get('http://namenode:8088/ws/v1/cluster/info', { timeout: 5000 });
    status.yarn = yarnResponse.status === 200 ? 'online' : 'offline';
  } catch (error) {
    status.yarn = 'error';
  }

  try {
    // Vérification Spark
    const sparkResponse = await axios.get('http://spark-master:8080/json/', { timeout: 5000 });
    status.spark = sparkResponse.status === 200 ? 'online' : 'offline';
  } catch (error) {
    status.spark = 'error';
  }

  try {
    // Vérification MongoDB
    if (mongoClient) {
      await mongoClient.db('bigdata').admin().ping();
      status.mongodb = 'online';
    }
  } catch (error) {
    status.mongodb = 'error';
  }

  return status;
}

// Routes API

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    services: ['hdfs', 'yarn', 'spark', 'mongodb'] 
  });
});

// Route pour le statut du cluster
app.get('/api/cluster/status', async (req, res) => {
  try {
    const status = await checkServiceStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

// Route pour les métriques HDFS
app.get('/api/hdfs/metrics', async (req, res) => {
  try {
    const response = await axios.get('http://namenode:9870/jmx?qry=Hadoop:service=NameNode,name=FSNamesystemState');
    const metrics = response.data.beans[0];
    
    res.json({
      totalCapacity: metrics.CapacityTotal,
      usedCapacity: metrics.CapacityUsed,
      availableCapacity: metrics.CapacityRemaining,
      filesAndDirectories: metrics.FilesTotal,
      blocks: metrics.BlocksTotal,
      missingBlocks: metrics.MissingBlocks,
      corruptBlocks: metrics.CorruptBlocks
    });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les métriques HDFS' });
  }
});

// Route pour les métriques YARN
app.get('/api/yarn/metrics', async (req, res) => {
  try {
    const response = await axios.get('http://namenode:8088/ws/v1/cluster/metrics');
    const metrics = response.data.clusterMetrics;
    
    res.json({
      totalMemory: metrics.totalMB,
      usedMemory: metrics.allocatedMB,
      availableMemory: metrics.availableMB,
      totalCores: metrics.totalVirtualCores,
      usedCores: metrics.allocatedVirtualCores,
      availableCores: metrics.availableVirtualCores,
      activeNodes: metrics.activeNodes,
      lostNodes: metrics.lostNodes,
      unhealthyNodes: metrics.unhealthyNodes
    });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les métriques YARN' });
  }
});

// Route pour les métriques Spark
app.get('/api/spark/metrics', async (req, res) => {
  try {
    const response = await axios.get('http://spark-master:8080/json/');
    const data = response.data;
    
    res.json({
      status: data.status,
      workers: data.workers.length,
      aliveWorkers: data.aliveworkers,
      cores: data.cores,
      coresUsed: data.coresused,
      memory: data.memory,
      memoryUsed: data.memoryused,
      activeApps: data.activeapps.length,
      completedApps: data.completedapps.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les métriques Spark' });
  }
});

// Route pour les données MongoDB
app.get('/api/data/sales', async (req, res) => {
  try {
    const db = mongoClient.db('bigdata');
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    
    const sales = await db.collection('sales_data')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('sales_data').countDocuments();
    
    res.json({
      data: sales,
      total: total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données de vente' });
  }
});

// Route pour les analyses
app.get('/api/analytics/sales-by-region', async (req, res) => {
  try {
    const db = mongoClient.db('bigdata');
    
    const pipeline = [
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$region',
          totalSales: { $sum: '$total_amount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total_amount' }
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ];
    
    const result = await db.collection('sales_data').aggregate(pipeline).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'analyse par région' });
  }
});

// Route pour l'analyse temporelle
app.get('/api/analytics/monthly-trends', async (req, res) => {
  try {
    const db = mongoClient.db('bigdata');
    
    const pipeline = [
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalSales: { $sum: '$total_amount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          totalSales: 1,
          orderCount: 1
        }
      }
    ];
    
    const result = await db.collection('sales_data').aggregate(pipeline).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'analyse temporelle' });
  }
});

// Route pour exécuter des jobs Pig
app.post('/api/jobs/pig/execute', async (req, res) => {
  try {
    const { scriptName, parameters } = req.body;
    
    // Simulation d'exécution de job Pig
    const jobId = `pig_job_${Date.now()}`;
    
    // Ici, vous pourriez déclencher un vrai job Pig
    // Pour la démonstration, nous simulons
    
    res.json({
      jobId: jobId,
      status: 'submitted',
      scriptName: scriptName,
      timestamp: new Date(),
      message: 'Job Pig soumis avec succès'
    });
    
    // Simulation de l'achèvement du job après 10 secondes
    setTimeout(() => {
      io.emit('job-completed', {
        jobId: jobId,
        status: 'completed',
        timestamp: new Date()
      });
    }, 10000);
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'exécution du job Pig' });
  }
});

// Route pour lister les jobs
app.get('/api/jobs/list', (req, res) => {
  // Simulation de la liste des jobs
  const jobs = [
    {
      id: 'pig_job_001',
      type: 'pig',
      name: 'sales_analysis.pig',
      status: 'completed',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 3000000),
      duration: 600000
    },
    {
      id: 'pig_job_002',
      type: 'pig',
      name: 'mongodb_integration.pig',
      status: 'running',
      startTime: new Date(Date.now() - 300000),
      endTime: null,
      duration: null
    },
    {
      id: 'spark_job_001',
      type: 'spark',
      name: 'data_processing',
      status: 'completed',
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 6900000),
      duration: 300000
    }
  ];
  
  res.json(jobs);
});

// WebSocket pour les mises à jour en temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);
  
  // Envoi du statut initial
  checkServiceStatus().then(status => {
    socket.emit('status-update', status);
  });
  
  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Tâche planifiée pour vérifier le statut toutes les 30 secondes
const statusJob = new cron.CronJob('*/30 * * * * *', async () => {
  try {
    const status = await checkServiceStatus();
    io.emit('status-update', status);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
  }
});

// Démarrage du serveur
async function startServer() {
  try {
    // Connexion à MongoDB
    await connectToMongo();
    
    // Démarrage de la tâche de surveillance
    statusJob.start();
    
    // Démarrage du serveur
    server.listen(PORT, () => {
      console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
      console.log(`📊 Dashboard disponible sur http://localhost:3000`);
      console.log(`🔧 API disponible sur http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur...');
  
  if (statusJob) {
    statusJob.stop();
  }
  
  if (mongoClient) {
    await mongoClient.close();
  }
  
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

// Démarrage
startServer();