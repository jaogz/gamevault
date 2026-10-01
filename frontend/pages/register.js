import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { setCurrentUser } from '../lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Register() {
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
      const res = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao criar perfil');
      }

      setCurrentUser(data);
      router.push('/');
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Não consegui conectar ao servidor. Se ele acabou de ser aberto, espere cerca de 1 minuto e tente de novo.');
      } else {
        setError(typeof err.message === 'string' ? err.message : 'Erro ao criar perfil');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Criar perfil</h1>
        <p className="auth-subtitle">Leva 10 segundos, é só pra separar sua coleção</p>

        <form onSubmit={handleSubmit}>
          <label>Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus minLength={3} />

          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />

          <div className="form-buttons">
            <button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar perfil'}</button>
          </div>

          {error && <div className="error">{error}</div>}
        </form>

        <p className="auth-switch">
          Já tem perfil? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
