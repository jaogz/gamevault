import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Nav from '../components/Nav';
import GameCard from '../components/GameCard';
import { getCurrentUser } from '../lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PublicProfile() {
  const router = useRouter();
  const { id } = router.query;

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [me, setMe] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState('all'); // all | favorites | rated
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addedIds, setAddedIds] = useState([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setMe(user);
    setCheckedAuth(true);
  }, []);

  useEffect(() => {
    if (!checkedAuth || !id) return;
    loadProfile();
  }, [checkedAuth, id]);

  function loadProfile() {
    setLoading(true);
    Promise.all([
      fetch(`${BASE_URL}/users/${id}`).then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      }),
      fetch(`${BASE_URL}/games?userId=${id}`).then((res) => res.json()),
    ])
      .then(([userData, gamesData]) => {
        setProfileUser(userData);
        setGames(gamesData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }

  async function handleAddToLibrary(game) {
    if (!me) return;
    try {
      const res = await fetch(`${BASE_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: me.id,
          name: game.name,
          platform: game.platform || undefined,
          genre: game.genre || undefined,
          description: game.description || undefined,
          imageUrl: game.imageUrl || undefined,
          // status, review, rating, favorite, hoursPlayed ficam zerados:
          // são pessoais de quem está copiando, não de quem cadastrou.
        }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar');
      setAddedIds((prev) => [...prev, game.id]);
      setNotice(`"${game.name}" foi adicionado à sua biblioteca!`);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice('Não foi possível adicionar o jogo.');
    }
  }

  if (!checkedAuth) return null;

  const visibleGames = games.filter((g) => {
    if (filter === 'favorites') return g.favorite;
    if (filter === 'rated') return g.rating && g.rating > 0;
    return true;
  });

  const isOwnProfile = me && profileUser && me.id === profileUser.id;

  return (
    <div className="container">
      <Nav />

      {!id ? (
        <div className="empty">Nenhum perfil selecionado. Volte em "Perfis" e escolha alguém.</div>
      ) : loading ? (
        <p>Carregando...</p>
      ) : notFound ? (
        <div className="empty">Perfil não encontrado.</div>
      ) : (
        <>
          <div className="profile-header">
            <div className="profile-cover">
              {profileUser.coverUrl && <img src={profileUser.coverUrl} alt="" />}
            </div>
            <div className="profile-header-body">
              <div className="profile-avatar-large">
                {profileUser.avatarUrl ? (
                  <img src={profileUser.avatarUrl} alt={profileUser.username} />
                ) : (
                  <span>{profileUser.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="profile-header-info">
                <h1>{profileUser.username}</h1>
                {profileUser.location && <div className="profile-location">📍 {profileUser.location}</div>}
                {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
                <p style={{ fontSize: 13, color: '#777', margin: '4px 0 0' }}>
                  {games.length} jogo(s) na coleção
                </p>
              </div>
              {isOwnProfile && (
                <Link href="/account">
                  <button className="secondary">Editar perfil</button>
                </Link>
              )}
            </div>
          </div>

          {notice && <div className="notice">{notice}</div>}

          <div className="toolbar">
            <button className={filter === 'all' ? '' : 'secondary'} onClick={() => setFilter('all')}>
              Todos
            </button>
            <button className={filter === 'favorites' ? '' : 'secondary'} onClick={() => setFilter('favorites')}>
              Favoritos
            </button>
            <button className={filter === 'rated' ? '' : 'secondary'} onClick={() => setFilter('rated')}>
              Avaliados
            </button>
          </div>

          {visibleGames.length === 0 ? (
            <div className="empty">Nenhum jogo por aqui ainda.</div>
          ) : (
            <div className="game-grid">
              {visibleGames.map((g) => (
                <GameCard
                  key={g.id}
                  game={g}
                  readOnly
                  onAddToLibrary={
                    !isOwnProfile && !addedIds.includes(g.id) ? handleAddToLibrary : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
