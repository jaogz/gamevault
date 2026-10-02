import React from 'react';
import '../styles/globals.css';

// Se alguma tela quebrar, mostra o motivo em vez de uma página em branco.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <h1>Algo deu errado</h1>
          <p style={{ fontSize: 14 }}>
            Essa tela não conseguiu carregar. Isso costuma acontecer quando o servidor ainda está acordando.
          </p>
          <div className="error" style={{ wordBreak: 'break-word' }}>
            {String(this.state.error.message || this.state.error)}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => window.location.reload()}>Recarregar</button>
            <button className="secondary" onClick={() => { window.location.href = '/'; }}>Ir para o início</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
