import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import { getCurrentUser } from '../lib/auth';
import { BASE_URL } from '../lib/constants';

export default function Dashboard() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCheckedAuth(true);
    fetch(`${BASE_URL}/games?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setGames(data))
      .finally(() => setLoading(false));
  }, []);

  if (!checkedAuth) return null;

  const byStatus = games.reduce((acc, g) => {
    const key = g.status || 'Sem status';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const totalHours = games.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0);
  const favoritesCount = games.filter((g) => g.favorite).length;
  const ratedGames = games.filter((g) => g.rating != null && g.rating > 0);
  const avgRating = ratedGames.length
    ? (ratedGames.reduce((sum, g) => sum + g.rating, 0) / ratedGames.length).toFixed(1)
    : '-';

  const byGenre = games.reduce((acc, g) => {
    (g.genres || []).forEach((name) => {
      acc[name] = (acc[name] || 0) + 1;
    });
    return acc;
  }, {});
  const genreEntries = Object.entries(byGenre).sort((a, b) => b[1] - a[1]);
  const maxGenre = Math.max(1, ...Object.values(byGenre));

  const maxCount = Math.max(1, ...Object.values(byStatus));

  return (
    <div className="container">
      <Nav />
      <h1>Dashboard</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-value">{games.length}</div>
              <div className="stat-label">Jogos</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{totalHours}h</div>
              <div className="stat-label">Horas jogadas</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{favoritesCount}</div>
              <div className="stat-label">Favoritos</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{avgRating}</div>
              <div className="stat-label">Nota média</div>
            </div>
          </div>

          <h2 style={{ fontSize: 16, marginTop: 28 }}>Jogos por status</h2>
          {Object.keys(byStatus).length === 0 ? (
            <p style={{ fontSize: 14 }}>Nenhum jogo cadastrado ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byStatus).map(([status, count]) => (
                  <tr key={status}>
                    <td>{status}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: '#000', height: 14, width: `${(count / maxCount) * 150}px` }} />
                        <span>{count}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ fontSize: 16, marginTop: 28 }}>Gêneros mais jogados</h2>
          {genreEntries.length === 0 ? (
            <p style={{ fontSize: 14 }}>Nenhum gênero registrado ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Gênero</th>
                  <th>Jogos</th>
                </tr>
              </thead>
              <tbody>
                {genreEntries.map(([name, count]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: '#000', height: 14, width: `${(count / maxGenre) * 150}px` }} />
                        <span>{count}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
