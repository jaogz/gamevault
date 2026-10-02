import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import CatalogCard from '../components/CatalogCard';
import { BASE_URL, GENRES } from '../lib/constants';

const SORTS = [
  { value: 'popular', label: 'Mais populares' },
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name', label: 'Nome (A-Z)' },
];

export default function Explore() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('popular');
  const [result, setResult] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lê ?sort= / ?genre= / ?q= da URL (links da tela inicial)
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.sort) setSort(String(router.query.sort));
    if (router.query.genre) setGenre(String(router.query.genre));
    if (router.query.q) setQ(String(router.query.q));
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q, genre, sort });
      fetch(`${BASE_URL}/games/catalog?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setResult(data);
          setError('');
        })
        .catch(() => setError('Não consegui conectar ao servidor.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [q, genre, sort, router.isReady]);

  return (
    <div className="container">
      <Nav />
      <div className="page-header">
        <h1>Explorar jogos</h1>
      </div>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        Todos os jogos cadastrados pela comunidade, com a nota média de quem já jogou.
      </p>

      <div className="toolbar">
        <input
          placeholder="Buscar jogo pelo nome..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        <button type="button" className={genre === '' ? 'chip chip-on' : 'chip'} onClick={() => setGenre('')}>
          Todos
        </button>
        {GENRES.map((g) => (
          <button
            type="button"
            key={g}
            className={genre === g ? 'chip chip-on' : 'chip'}
            onClick={() => setGenre(genre === g ? '' : g)}
          >
            {g}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <p style={{ fontSize: 14 }}>
        {loading ? 'Buscando...' : <><strong>{result.items.length}</strong> de <strong>{result.total}</strong> jogos</>}
      </p>

      {!loading && result.items.length === 0 ? (
        <div className="empty">Nenhum jogo encontrado com esses filtros.</div>
      ) : (
        <div className="catalog-grid">
          {result.items.map((g) => (
            <CatalogCard key={g.key} item={g} />
          ))}
        </div>
      )}
    </div>
  );
}
