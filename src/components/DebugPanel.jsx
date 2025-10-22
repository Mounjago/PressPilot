import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');
  const auth = useAuth();

  const addLog = (message, type = 'info') => {
    console.log(`[DEBUG] ${message}`);
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  useEffect(() => {
    addLog('🔍 Debug Panel Initialized');
    addLog(`Environment: ${import.meta.env.MODE}`);
    addLog(`API URL: ${config.apiUrl}`);
    addLog(`Config Valid: ${config.isConfigValid()}`);

    // Test backend connectivity
    const testBackend = async () => {
      try {
        addLog('🌐 Testing backend connectivity...');
        const response = await fetch(`${config.apiUrl}/health`, {
          method: 'GET',
          timeout: 5000
        });

        if (response.ok) {
          const data = await response.json();
          setBackendStatus('online');
          addLog(`✅ Backend is online: ${JSON.stringify(data)}`, 'success');
        } else {
          setBackendStatus('error');
          addLog(`❌ Backend responded with status: ${response.status}`, 'error');
        }
      } catch (error) {
        setBackendStatus('offline');
        addLog(`❌ Backend connectivity failed: ${error.message}`, 'error');
      }
    };

    testBackend();
  }, []);

  useEffect(() => {
    addLog(`Auth State Changed: ${JSON.stringify({
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      user: auth.user ? auth.user.email : null,
      error: auth.error
    })}`);
  }, [auth.isAuthenticated, auth.isLoading, auth.user, auth.error]);

  const testComponents = async () => {
    addLog('🧪 Testing component rendering...');

    // Test HomePage import
    try {
      const HomePage = await import('../pages/HomePage');
      addLog('✅ HomePage import successful', 'success');
    } catch (error) {
      addLog(`❌ HomePage import failed: ${error.message}`, 'error');
    }

    // Test AuthContext
    try {
      if (typeof auth.login === 'function') {
        addLog('✅ AuthContext functions available', 'success');
      } else {
        addLog('❌ AuthContext functions missing', 'error');
      }
    } catch (error) {
      addLog(`❌ AuthContext error: ${error.message}`, 'error');
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    addLog('🗑️ Local storage cleared', 'warning');
    window.location.reload();
  };

  const styles = {
    debugPanel: {
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      background: '#1a1a1a',
      color: '#fff',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      overflow: 'hidden'
    },
    header: {
      borderBottom: '1px solid #333',
      paddingBottom: '8px',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      margin: 0,
      fontSize: '14px',
      fontWeight: 'bold'
    },
    status: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      background: backendStatus === 'online' ? '#22c55e' :
                 backendStatus === 'offline' ? '#ef4444' : '#f59e0b',
      color: 'white'
    },
    logContainer: {
      maxHeight: '300px',
      overflowY: 'auto',
      marginBottom: '8px'
    },
    logEntry: {
      padding: '2px 0',
      borderBottom: '1px solid #333',
      fontSize: '11px'
    },
    info: { color: '#94a3b8' },
    success: { color: '#22c55e' },
    error: { color: '#ef4444' },
    warning: { color: '#f59e0b' },
    button: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      cursor: 'pointer',
      marginRight: '4px'
    },
    dangerButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.debugPanel}>
      <div style={styles.header}>
        <h3 style={styles.title}>Debug Panel</h3>
        <span style={styles.status}>
          Backend: {backendStatus}
        </span>
      </div>

      <div style={styles.logContainer}>
        {logs.map((log, index) => (
          <div key={index} style={{...styles.logEntry, ...styles[log.type]}}>
            [{log.time}] {log.message}
          </div>
        ))}
      </div>

      <div>
        <button style={styles.button} onClick={testComponents}>
          Test Components
        </button>
        <button style={styles.dangerButton} onClick={clearLocalStorage}>
          Clear Storage
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;