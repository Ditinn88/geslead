import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Erreur interceptée par ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#1A1A1A', color: '#F2F0E9', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h1 style={{ color: '#CC5833', fontSize: '24px', marginBottom: '16px' }}>Erreur d'affichage détectée</h1>
          <p style={{ marginBottom: '12px', fontSize: '16px' }}>{String(this.state.error)}</p>
          <pre style={{ background: '#262626', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', color: '#E8634A' }}>
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#2E4036', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
