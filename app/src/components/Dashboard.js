// app/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  backdrop-filter: blur(10px);
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.boxShadow};
  padding: ${props => props.theme.spacing.lg};
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.dark};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, ${props => props.color || props.theme.colors.primary}, ${props => props.colorSecondary || props.theme.colors.secondary});
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius};
  text-align: center;
  box-shadow: ${props => props.theme.boxShadow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-top: ${props => props.theme.spacing.md};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.dark};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  background: rgba(231, 76, 60, 0.1);
  border-radius: ${props => props.theme.borderRadius};
  margin: ${props => props.theme.spacing.md} 0;
`;

const COLORS = ['#4A90E2', '#F39C12', '#27AE60', '#E74C3C', '#9B59B6', '#1ABC9C'];

function Dashboard({ socket }) {
  const [metrics, setMetrics] = useState({
    hdfs: null,
    yarn: null,
    spark: null,
    mongodb: null
  });
  const [salesData, setSalesData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    // Mise à jour automatique toutes les 60 secondes
    const interval = setInterval(loadDashboardData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('status-update', (status) => {
        console.log('Statut mis à jour:', status);
      });

      socket.on('metrics-update', (newMetrics) => {
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          ...newMetrics
        }));
      });
    }
  }, [socket]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chargement parallèle de toutes les données
      const [
        hdfsResponse,
        yarnResponse,
        sparkResponse,
        salesResponse,
        trendsResponse,
        regionResponse
      ] = await Promise.allSettled([
        axios.get('/api/hdfs/metrics'),
        axios.get('/api/yarn/metrics'),
        axios.get('/api/spark/metrics'),
        axios.get('/api/data/sales?limit=1000'),
        axios.get('/api/analytics/monthly-trends'),
        axios.get('/api/analytics/sales-by-region')
      ]);

      // Traitement des métriques HDFS
      if (hdfsResponse.status === 'fulfilled') {
        setMetrics(prev => ({ ...prev, hdfs: hdfsResponse.value.data }));
      }

      // Traitement des métriques YARN
      if (yarnResponse.status === 'fulfilled') {
        setMetrics(prev => ({ ...prev, yarn: yarnResponse.value.data }));
      }

      // Traitement des métriques Spark
      if (sparkResponse.status === 'fulfilled') {
        setMetrics(prev => ({ ...prev, spark: sparkResponse.value.data }));
      }

      // Traitement des données de vente
      if (salesResponse.status === 'fulfilled') {
        setSalesData(salesResponse.value.data.data || []);
      }

      // Traitement des tendances mensuelles
      if (trendsResponse.status === 'fulfilled') {
        setMonthlyTrends(trendsResponse.value.data || []);
      }

      // Traitement des données par région
      if (regionResponse.status === 'fulfilled') {
        setRegionData(regionResponse.value.data || []);
      }

    } catch (err) {
      setError('Erreur lors du chargement des données du dashboard');
      console.error('Erreur dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (loading) {
    return (
      <LoadingSpinner>
        🔄 Chargement du dashboard...
      </LoadingSpinner>
    );
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <div>
      {/* Métriques principales */}
      <MetricGrid>
        <MetricCard color="#4A90E2" colorSecondary="#5DADE2">
          <MetricValue>{formatNumber(salesData.length)}</MetricValue>
          <MetricLabel>📊 Total des Ventes</MetricLabel>
        </MetricCard>

        <MetricCard color="#27AE60" colorSecondary="#58D68D">
          <MetricValue>
            {metrics.hdfs ? Math.round((metrics.hdfs.usedCapacity / metrics.hdfs.totalCapacity) * 100) : 0}%
          </MetricValue>
          <MetricLabel>💾 Utilisation HDFS</MetricLabel>
        </MetricCard>

        <MetricCard color="#F39C12" colorSecondary="#F8C471">
          <MetricValue>
            {metrics.yarn ? metrics.yarn.activeNodes : 0}
          </MetricValue>
          <MetricLabel>🖥️ Nœuds YARN Actifs</MetricLabel>
        </MetricCard>

        <MetricCard color="#9B59B6" colorSecondary="#BB8FCE">
          <MetricValue>
            {metrics.spark ? metrics.spark.aliveWorkers : 0}
          </MetricValue>
          <MetricLabel>⚡ Workers Spark</MetricLabel>
        </MetricCard>
      </MetricGrid>

      {/* Graphiques */}
      <DashboardContainer>
        {/* Tendances mensuelles */}
        <Card>
          <CardTitle>📈 Tendances Mensuelles des Ventes</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'totalSales' ? `${formatNumber(value)} €` : formatNumber(value),
                  name === 'totalSales' ? 'Revenus' : 'Commandes'
                ]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalSales" 
                  stroke="#4A90E2" 
                  strokeWidth={3}
                  dot={{ fill: '#4A90E2', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orderCount" 
                  stroke="#F39C12" 
                  strokeWidth={2}
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Ventes par région */}
        <Card>
          <CardTitle>🗺️ Ventes par Région</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="totalSales"
                  nameKey="_id"
                  label={({ _id, percent }) => `${_id} (${(percent * 100).toFixed(1)}%)`}
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${formatNumber(value)} €`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Métriques HDFS */}
        <Card>
          <CardTitle>💾 Métriques HDFS</CardTitle>
          {metrics.hdfs ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Capacité totale:</strong> {formatBytes(metrics.hdfs.totalCapacity)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Utilisée:</strong> {formatBytes(metrics.hdfs.usedCapacity)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Disponible:</strong> {formatBytes(metrics.hdfs.availableCapacity)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Fichiers:</strong> {formatNumber(metrics.hdfs.filesAndDirectories)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Blocs:</strong> {formatNumber(metrics.hdfs.blocks)}
              </div>
              {metrics.hdfs.missingBlocks > 0 && (
                <div style={{ color: '#E74C3C' }}>
                  <strong>⚠️ Blocs manquants:</strong> {metrics.hdfs.missingBlocks}
                </div>
              )}
            </div>
          ) : (
            <div>Données HDFS non disponibles</div>
          )}
        </Card>

        {/* Métriques YARN */}
        <Card>
          <CardTitle>🖥️ Métriques YARN</CardTitle>
          {metrics.yarn ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Mémoire totale:</strong> {formatBytes(metrics.yarn.totalMemory * 1024 * 1024)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Mémoire utilisée:</strong> {formatBytes(metrics.yarn.usedMemory * 1024 * 1024)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Cœurs totaux:</strong> {metrics.yarn.totalCores}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Cœurs utilisés:</strong> {metrics.yarn.usedCores}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Nœuds actifs:</strong> {metrics.yarn.activeNodes}
              </div>
              {metrics.yarn.lostNodes > 0 && (
                <div style={{ color: '#E74C3C' }}>
                  <strong>⚠️ Nœuds perdus:</strong> {metrics.yarn.lostNodes}
                </div>
              )}
            </div>
          ) : (
            <div>Données YARN non disponibles</div>
          )}
        </Card>

        {/* Performance par région */}
        <Card>
          <CardTitle>🏆 Performance par Région</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'totalSales' ? `${formatNumber(value)} €` : 
                  name === 'avgOrderValue' ? `${formatNumber(value)} €` : formatNumber(value),
                  name === 'totalSales' ? 'Revenus totaux' :
                  name === 'avgOrderValue' ? 'Valeur moyenne' : 'Commandes'
                ]} />
                <Legend />
                <Bar dataKey="totalSales" fill="#4A90E2" />
                <Bar dataKey="orderCount" fill="#F39C12" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </DashboardContainer>
    </div>
  );
}

export default Dashboard;