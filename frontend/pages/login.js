import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { setCurrentUser } from '../lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Usuário ou senha incorretos');
      }

      setCurrentUser(data);
      router.push('/');
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Não consegui conectar ao servidor. Se ele acabou de ser aberto, espere cerca de 1 minuto e tente de novo.');
      } else {
        setError(typeof err.message === 'string' ? err.message : 'Erro ao entrar');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>GameVault</h1>
        <p className="auth-subtitle">Sua biblioteca pessoal de jogos</p>

        <form onSubmit={handleSubmit}>
          <label>Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />

          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <div className="form-buttons">
            <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </div>

          {error && <div className="error">{error}</div>}
        </form>

        <p className="auth-switch">
          Ainda não tem conta? <Link href="/register">Criar perfil</Link>
        </p>
      </div>
    </div>
  );
}
