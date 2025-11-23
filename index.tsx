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
    rootElement.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 800px; margin: 2rem auto; background: #fee2e2; border-radius: 8px;">
        <h1 style="color: #dc2626;">⛔ Fatal Initialization Error</h1>
        <p><strong>The application failed to initialize.</strong></p>
        <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
        <p style="margin-top: 1rem;"><strong>Check the browser console (F12) for details.</strong></p>
      </div>
    `;
  }
}