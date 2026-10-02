import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import { getCurrentUser } from '../lib/auth';
import { apiGet, describeError } from '../lib/api';

export default function Profiles() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sort, setSort] = useState('name');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUserState(user);
    setCheckedAuth(true);

    apiGet('/users')
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false));
  }, []);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = users.filter(
      (u) =>
        !term ||
        u.username.toLowerCase().includes(term) ||
        (u.location || '').toLowerCase().includes(term)
    );
    if (sort === 'games') list = [...list].sort((a, b) => b.gameCount - a.gameCount);
    else if (sort === 'recent') list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else list = [...list].sort((a, b) => a.username.localeCompare(b.username));
    return list;
  }, [users, search, sort]);

  if (!checkedAuth) return null;

  return (
    <div className="container">
      <Nav />
      <h1>Perfis</h1>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        Veja a coleção de jogos de outros usuários cadastrados no GameVault.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <input
          placeholder="Buscar usuário pelo nome ou localização..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Nome (A-Z)</option>
          <option value="games">Mais jogos</option>
          <option value="recent">Mais recentes</option>
        </select>
      </div>

      {!loading && users.length > 0 && (
        <p style={{ fontSize: 14 }}>
          <strong>{visibleUsers.length}</strong> de <strong>{users.length}</strong> usuários
        </p>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : users.length === 0 ? (
        <div className="empty">Nenhum perfil cadastrado ainda.</div>
      ) : visibleUsers.length === 0 ? (
        <div className="empty">Nenhum usuário encontrado com esse nome.</div>
      ) : (
        <div className="profile-list">
          {visibleUsers.map((u) => (
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
