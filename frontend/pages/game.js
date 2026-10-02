import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import Avatar from '../components/Avatar';
import StarsReadOnly from '../components/StarsReadOnly';
import { getCurrentUser } from '../lib/auth';
import { BASE_URL, timeAgo } from '../lib/constants';

export default function GamePage() {
  const router = useRouter();
  const name = router.query.name;

  const [me, setMe] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!router.isReady || !name) return;
    load();
  }, [router.isReady, name]);

  function load() {
    setLoading(true);
    fetch(`${BASE_URL}/games/catalog/detail?name=${encodeURIComponent(name)}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => {
        setGame(data);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }

  const myEntry = game && me ? game.entries.find((e) => e.userId === me.id) : null;

  async function addToLibrary() {
    if (!me) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: me.id,
          name: game.name,
          genres: game.genres,
          description: game.description || undefined,
          imageUrl: game.imageUrl || undefined,
          fromCatalog: !!game.description,
        }),
      });
      if (!res.ok) throw new Error('erro');
      setNotice('Jogo adicionado à sua biblioteca! Agora é só preencher sua nota e opinião.');
      load();
    } catch (err) {
      setNotice('Não foi possível adicionar o jogo.');
    }
  }

  const maxDist = game ? Math.max(1, ...game.distribution) : 1;
  const reviews = game
    ? game.entries
        .filter((e) => e.review && e.review.trim())
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    : [];

  return (
    <div className="container">
      <Nav />

      {!name ? (
        <div className="empty">Nenhum jogo selecionado. Vá em <Link href="/explore" style={{ textDecoration: 'underline' }}>Explorar</Link>.</div>
      ) : loading ? (
        <p>Carregando...</p>
      ) : notFound ? (
        <div className="empty">Jogo não encontrado.</div>
      ) : (
        <>
          <div className="game-hero">
            <div className="game-hero-cover">
              {game.imageUrl ? <img src={game.imageUrl} alt={game.name} /> : <div className="game-cover-placeholder">{game.name.charAt(0)}</div>}
            </div>
            <div className="game-hero-info">
              <h1>{game.name}</h1>
              {game.genres.length > 0 && (
                <div className="game-tags" style={{ margin: '6px 0 10px' }}>
                  {game.genres.map((g) => (
                    <Link key={g} href={`/explore?genre=${encodeURIComponent(g)}`} className="tag">{g}</Link>
                  ))}
                </div>
              )}
              {game.description && <p className="game-hero-description">{game.description}</p>}

              <div className="game-hero-actions">
                {myEntry ? (
                  <Link href="/library"><button className="secondary">✓ Na sua biblioteca</button></Link>
                ) : (
                  <button onClick={addToLibrary}>+ Adicionar à minha biblioteca</button>
                )}
              </div>
              {notice && <div className="notice" style={{ marginTop: 10 }}>{notice}</div>}
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-value">{game.avgRating != null ? game.avgRating.toFixed(1) : '-'}</div>
              <div className="stat-label">Nota média ({game.ratingCount} avaliações)</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{game.playerCount}</div>
              <div className="stat-label">Jogadores</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{game.favoriteCount}</div>
              <div className="stat-label">Favoritaram</div>
            </div>
          </div>

          {game.ratingCount > 0 && (
            <section className="home-section">
              <div className="section-header"><h2>Distribuição das notas</h2></div>
              <div className="dist">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n} className="dist-row">
                    <span className="dist-label">{n} ★</span>
                    <div className="dist-bar-bg">
                      <div className="dist-bar" style={{ width: `${(game.distribution[n - 1] / maxDist) * 100}%` }} />
                    </div>
                    <span className="dist-count">{game.distribution[n - 1]}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="home-section">
            <div className="section-header"><h2>Opiniões ({reviews.length})</h2></div>
            {reviews.length === 0 ? (
              <div className="empty">Ninguém escreveu uma opinião sobre este jogo ainda.</div>
            ) : (
              <div className="activity-list">
                {reviews.map((e) => (
                  <div key={e.id} className="activity-item">
                    <Link href={`/profile?id=${e.user.id}`}><Avatar user={e.user} size={40} /></Link>
                    <div className="activity-body">
                      <div style={{ fontSize: 13 }}>
                        <Link href={`/profile?id=${e.user.id}`} style={{ fontWeight: 700 }}>{e.user.username}</Link>
                        {e.status && <span className="you-badge"> · {e.status}</span>}
                        {e.hoursPlayed != null && <span className="you-badge"> · {e.hoursPlayed}h</span>}
                      </div>
                      {e.rating > 0 && <StarsReadOnly value={e.rating} />}
                      <p className="activity-review">{e.review}</p>
                      <div className="you-badge">{timeAgo(e.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <div className="section-header"><h2>Quem tem este jogo</h2></div>
            <div className="profile-list">
              {game.entries.map((e) => (
                <Link key={e.id} href={`/profile?id=${e.user.id}`} className="profile-item" style={{ alignItems: 'center' }}>
                  <Avatar user={e.user} />
                  <span style={{ flex: 1 }}>
                    <strong>{e.user.username}</strong>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      {[e.platform, e.status].filter(Boolean).join(' · ') || 'Sem status'}
                    </div>
                  </span>
                  {e.rating > 0 && <StarsReadOnly value={e.rating} />}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
