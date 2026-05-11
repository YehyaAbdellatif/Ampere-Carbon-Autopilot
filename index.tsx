import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Add error logging for production debugging
console.log('🚀 App initialization starting...');
console.log('Environment:', process.env.NODE_ENV);

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple error boundary component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('⛔ React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '2rem auto' }}>
          <h1 style={{ color: '#dc2626' }}>⛔ Application Error</h1>
          <p><strong>Something went wrong loading the app.</strong></p>
          <details style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{ marginTop: '1rem', overflow: 'auto', fontSize: '0.875rem' }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <p style={{ marginTop: '1rem' }}>
            <strong>What to do:</strong>
          </p>
          <ul>
            <li>Check the browser console (F12) for more details</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cache and reload</li>
            <li>Contact support with the error details above</li>
          </ul>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  console.log('✅ Root element found');

  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ React root created');

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('⛔ Fatal error during app initialization:', error);

  // Show error on page if React fails to initialize
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 2rem; font-family: system-ui; max-width: 800px; margin: 2rem auto; background: #fee2e2; border-radius: 8px;';
    const h1 = document.createElement('h1');
    h1.style.color = '#dc2626';
    h1.textContent = 'Fatal Initialization Error';
    const p1 = document.createElement('p');
    p1.innerHTML = '<strong>The application failed to initialize.</strong>';
    const p2 = document.createElement('p');
    p2.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    const p3 = document.createElement('p');
    p3.style.marginTop = '1rem';
    p3.innerHTML = '<strong>Check the browser console (F12) for details.</strong>';
    errorDiv.append(h1, p1, p2, p3);
    rootElement.innerHTML = '';
    rootElement.appendChild(errorDiv);
  }
}