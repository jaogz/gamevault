import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import { getCurrentUser } from '../lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Profiles() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUserState(user);
    setCheckedAuth(true);

    fetch(`${BASE_URL}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  if (!checkedAuth) return null;

  return (
    <div className="container">
      <Nav />
      <h1>Perfis</h1>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        Veja a coleção de jogos de outros usuários cadastrados no GameVault.
      </p>

      {loading ? (
        <p>Carregando...</p>
      ) : users.length === 0 ? (
        <div className="empty">Nenhum perfil cadastrado ainda.</div>
      ) : (
        <div className="profile-list">
          {users.map((u) => (
            <Link key={u.id} href={`/profile?id=${u.id}`} className="profile-item">
              <span className="profile-avatar">
                {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : u.username.charAt(0).toUpperCase()}
              </span>
              <span>
                <strong>{u.username}</strong>
                {u.id === currentUser?.id && <span className="you-badge"> (você)</span>}
                {u.location && <span className="you-badge"> · 📍 {u.location}</span>}
                <div style={{ fontSize: 12, color: '#555' }}>{u.gameCount} jogo(s) na coleção</div>
                {u.bio && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{u.bio}</div>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
