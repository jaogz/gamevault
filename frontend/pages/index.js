import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Avatar from '../components/Avatar';
import CatalogCard from '../components/CatalogCard';
import StarsReadOnly from '../components/StarsReadOnly';
import { getCurrentUser } from '../lib/auth';
import { gameLink, timeAgo } from '../lib/constants';
import { apiGet, describeError } from '../lib/api';

export default function Home() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);

    apiGet('/games/home')
      .then(setData)
      .catch((err) => setError(describeError(err)));

    if (current) {
      apiGet(`/games/feed?userId=${current.id}`)
        .then(setFeed)
        .catch(() => setFeed([]));
    }
  }, []);

  return (
    <div className="container">
      <Nav />

      <section className="hero">
        {user ? (
          <>
            <h1>Olá, {user.username}!</h1>
            <p>Veja o que a comunidade anda jogando e registre o que você jogou por último.</p>
            <div className="hero-actions">
              <Link href="/library"><button>Minha biblioteca</button></Link>
              <Link href="/explore"><button className="secondary">Explorar jogos</button></Link>
            </div>
          </>
        ) : (
          <>
            <h1>Sua biblioteca de jogos, do seu jeito.</h1>
            <p>Registre o que você joga, avalie, escreva sua opinião e descubra o que outras pessoas estão jogando.</p>
            <div className="hero-actions">
              <Link href="/register"><button>Criar conta grátis</button></Link>
              <Link href="/explore"><button className="secondary">Explorar jogos</button></Link>
            </div>
          </>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      {!data && !error && <p>Carregando...</p>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-box"><div className="stat-value">{data.stats.users}</div><div className="stat-label">Jogadores</div></div>
            <div className="stat-box"><div className="stat-value">{data.stats.uniqueGames}</div><div className="stat-label">Jogos no catálogo</div></div>
            <div className="stat-box"><div className="stat-value">{data.stats.games}</div><div className="stat-label">Jogos registrados</div></div>
            <div className="stat-box"><div className="stat-value">{data.stats.reviews}</div><div className="stat-label">Opiniões escritas</div></div>
          </div>

          {user && (
            <section className="home-section">
              <div className="section-header"><h2>Atividade de quem você segue</h2></div>
              {feed === null ? (
                <p>Carregando...</p>
              ) : feed.length === 0 ? (
                <div className="empty">
                  Nada por aqui ainda. Siga outros jogadores na página de <Link href="/profiles" style={{ textDecoration: 'underline' }}>Perfis</Link> pra ver o que eles andam jogando.
                </div>
              ) : (
                <div className="activity-list">
                  {feed.map((a) => (
                    <ActivityItem key={a.id} a={a} />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="home-section">
            <div className="section-header">
              <h2>Populares na comunidade</h2>
              <Link href="/explore?sort=popular" className="see-all">Ver todos →</Link>
            </div>
            {data.popular.length === 0 ? (
              <div className="empty">Ainda não há jogos cadastrados.</div>
            ) : (
              <div className="catalog-grid">
                {data.popular.map((g) => <CatalogCard key={g.key} item={g} />)}
              </div>
            )}
          </section>

          {data.topRated.length > 0 && (
            <section className="home-section">
              <div className="section-header">
                <h2>Mais bem avaliados</h2>
                <Link href="/explore?sort=rating" className="see-all">Ver todos →</Link>
              </div>
              <div className="catalog-grid">
                {data.topRated.map((g) => <CatalogCard key={g.key} item={g} />)}
              </div>
            </section>
          )}

          {data.recentReviews.length > 0 && (
            <section className="home-section">
              <div className="section-header"><h2>Opiniões recentes</h2></div>
              <div className="activity-list">
                {data.recentReviews.map((a) => <ActivityItem key={a.id} a={a} showReview />)}
              </div>
            </section>
          )}

          {data.newUsers.length > 0 && (
            <section className="home-section">
              <div className="section-header">
                <h2>Novos jogadores</h2>
                <Link href="/profiles" className="see-all">Ver perfis →</Link>
              </div>
              <div className="profile-list">
                {data.newUsers.map((u) => (
                  <Link key={u.id} href={`/profile?id=${u.id}`} className="profile-item">
                    <Avatar user={u} />
                    <span>
                      <strong>{u.username}</strong>
                      <div style={{ fontSize: 12, color: '#555' }}>{u.gameCount} jogo(s) na coleção</div>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ActivityItem({ a, showReview }) {
  return (
    <div className="activity-item">
      <Link href={gameLink(a.name)} className="activity-cover">
        {a.imageUrl ? <img src={a.imageUrl} alt="" /> : <span>{a.name.charAt(0)}</span>}
      </Link>
      <div className="activity-body">
        <div style={{ fontSize: 13 }}>
          <Link href={`/profile?id=${a.user.id}`} style={{ fontWeight: 700 }}>{a.user.username}</Link>
          {' '}adicionou <Link href={gameLink(a.name)} style={{ fontWeight: 700 }}>{a.name}</Link>
          {a.status && <span className="you-badge"> · {a.status}</span>}
        </div>
        {a.rating > 0 && <StarsReadOnly value={a.rating} />}
        {(showReview || a.review) && a.review && <p className="activity-review">{a.review}</p>}
        <div className="you-badge">{timeAgo(a.createdAt)}</div>
      </div>
    </div>
  );
}
