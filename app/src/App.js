// app/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import axios from 'axios';
import io from 'socket.io-client';

// Composants
import Dashboard from './components/Dashboard';
import ClusterMonitoring from './components/ClusterMonitoring';
import DataAnalytics from './components/DataAnalytics';
import JobManager from './components/JobManager';
import DataExplorer from './components/DataExplorer';

// Styles globaux
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
  }

  #root {
    min-height: 100vh;
  }
`;

// Thème
const theme = {
  colors: {
    primary: '#4A90E2',
    secondary: '#F39C12',
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F1C40F',
    dark: '#2C3E50',
    light: '#ECF0F1',
    background: 'rgba(255, 255, 255, 0.95)',
    cardBackground: 'rgba(255, 255, 255, 0.9)',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

// Styles
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: ${props => props.theme.colors.cardBackground};
  backdrop-filter: blur(10px);
  box-shadow: ${props => props.theme.boxShadow};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled.h1`
  color: ${props => props.theme.colors.primary};
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
`;

const Navigation = styled.nav`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-left: auto;
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.dark};
  text-decoration: none;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius};
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    transform: translateY(-2px);
  }

  &.active {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${props => props.theme.spacing.lg};
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

const StatusBar = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  backdrop-filter: blur(10px);
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => 
    props.status === 'online' ? props.theme.colors.success :
    props.status === 'warning' ? props.theme.colors.warning :
    props.theme.colors.error
  };
`;

const LoadingSpinner = styled.div`
  border: 4px solid ${props => props.theme.colors.light};
  border-top: 4px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function App() {
  const [clusterStatus, setClusterStatus] = useState({
    hdfs: 'loading',
    yarn: 'loading',
    spark: 'loading',
    mongodb: 'loading'
  });
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialisation du socket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Écoute des mises à jour de statut
    newSocket.on('status-update', (status) => {
      setClusterStatus(status);
    });

    // Vérification initiale du statut
    checkClusterStatus();

    // Nettoyage
    return () => {
      newSocket.close();
    };
  }, []);

  const checkClusterStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/cluster/status');
      setClusterStatus(response.data);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      setClusterStatus({
        hdfs: 'error',
        yarn: 'error',
        spark: 'error',
        mongodb: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallStatus = () => {
    const statuses = Object.values(clusterStatus);
    if (statuses.every(s => s === 'online')) return 'online';
    if (statuses.some(s => s === 'error')) return 'error';
    if (statuses.some(s => s === 'warning')) return 'warning';
    return 'loading';
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AppContainer>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div>
              <LoadingSpinner />
              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'white' }}>
                Chargement du cluster Big Data...
              </p>
            </div>
          </div>
        </AppContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AppContainer>
          <Header>
            <Logo>🚀 BigData Analytics Platform</Logo>
            <Navigation>
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/monitoring">Monitoring</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
              <NavLink to="/jobs">Jobs</NavLink>
              <NavLink to="/data">Data Explorer</NavLink>
            </Navigation>
          </Header>

          <MainContent>
            <Routes>
              <Route path="/" element={<Dashboard socket={socket} />} />
              <Route path="/monitoring" element={<ClusterMonitoring socket={socket} />} />
              <Route path="/analytics" element={<DataAnalytics socket={socket} />} />
              <Route path="/jobs" element={<JobManager socket={socket} />} />
              <Route path="/data" element={<DataExplorer socket={socket} />} />
            </Routes>
          </MainContent>

          <StatusBar>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <StatusIndicator>
                <StatusDot status={clusterStatus.hdfs} />
                <span>HDFS: {clusterStatus.hdfs}</span>
              </StatusIndicator>
              <StatusIndicator>
                <StatusDot status={clusterStatus.yarn} />
                <span>YARN: {clusterStatus.yarn}</span>
              </StatusIndicator>
              <StatusIndicator>
                <StatusDot status={clusterStatus.spark} />
                <span>Spark: {clusterStatus.spark}</span>
              </StatusIndicator>
              <StatusIndicator>
                <StatusDot status={clusterStatus.mongodb} />
                <span>MongoDB: {clusterStatus.mongodb}</span>
              </StatusIndicator>
            </div>
            <div>
              <StatusIndicator>
                <StatusDot status={getOverallStatus()} />
                <span>Cluster: {getOverallStatus()}</span>
              </StatusIndicator>
            </div>
          </StatusBar>
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;