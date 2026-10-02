import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import GameCard from '../components/GameCard';
import { getCurrentUser } from '../lib/auth';
import { BASE_URL, PLATFORMS, STATUSES, GENRES } from '../lib/constants';

const API_URL = `${BASE_URL}/games`;

const emptyForm = {
  id: null,
  name: '',
  platform: '',
  status: '',
  genres: [],
  description: '',
  fromCatalog: false,
  review: '',
  hoursPlayed: '',
  rating: 0,
  favorite: false,
  imageUrl: '',
  completedAt: '',
};

function FormStars({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="stars">
      {stars.map((n) => (
        <span
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          className="star"
          style={{ color: n <= value ? '#000' : '#ccc', fontSize: 22 }}
        >
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

export default function Library() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [user, setUser] = useState(null);

  const [games, setGames] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [genreFilter, setGenreFilter] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.push('/login');
      return;
    }
    setUser(current);
    setCheckedAuth(true);
    loadGames(current.id);
  }, []);

  async function loadGames(userId) {
    try {
      const res = await fetch(`${API_URL}?userId=${userId}`);
      const data = await res.json();
      setGames(data);
    } catch (err) {
      setError('Não foi possível conectar ao backend (verifique se ele está rodando na porta 3001).');
    }
  }

  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    const next = { ...form, [name]: type === 'checkbox' ? checked : value };

    if (name === 'name') {
      setShowSuggestions(true);
      // Mudou o nome na mão: já não é mais o jogo do catálogo, então a descrição volta a ser livre.
      if (!editing) next.fromCatalog = false;
    }

    setForm(next);
  }

  useEffect(() => {
    if (!form.name || form.name.trim().length < 2 || !showSuggestions) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL}/games/search-external?q=${encodeURIComponent(form.name)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.name, showSuggestions]);

  function toggleGenre(g) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  }

  async function pickSuggestion(item) {
    setSuggestions([]);
    setShowSuggestions(false);
    setForm((f) => ({ ...f, name: item.name, imageUrl: item.image }));

    if (!item.appid) return;

    setFetchingDetails(true);
    try {
      const res = await fetch(`${BASE_URL}/games/external-details?appid=${item.appid}`);
      const details = await res.json();
      if (details) {
        setForm((f) => ({
          ...f,
          genres: details.genres?.length ? details.genres : f.genres,
          description: details.description || f.description,
          fromCatalog: !!details.description,
          imageUrl: details.image || f.imageUrl,
        }));
      }
    } catch (err) {
      // segue com preenchimento manual
    } finally {
      setFetchingDetails(false);
    }
  }

  function startEdit(game) {
    setForm({
      ...game,
      genres: game.genres || [],
      fromCatalog: !!game.fromCatalog,
      hoursPlayed: game.hoursPlayed ?? '',
      rating: game.rating ?? 0,
      imageUrl: game.imageUrl || '',
      description: game.description || '',
      review: game.review || '',
      completedAt: game.completedAt ? game.completedAt.slice(0, 10) : '',
    });
    setEditing(true);
    setShowForm(true);
    setShowSuggestions(false);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      userId: user.id,
      platform: form.platform || undefined,
      status: form.status || undefined,
      genres: form.genres,
      fromCatalog: !!form.fromCatalog,
      description: form.description || undefined,
      review: form.review || undefined,
      hoursPlayed: form.hoursPlayed === '' ? undefined : Number(form.hoursPlayed),
      rating: form.rating || undefined,
      favorite: !!form.favorite,
      imageUrl: form.imageUrl || undefined,
      completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : undefined,
    };

    try {
      let res;
      if (editing) {
        res = await fetch(`${API_URL}/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao salvar jogo');
      }

      setForm(emptyForm);
      setEditing(false);
      setShowForm(false);
      loadGames(user.id);
    } catch (err) {
      setError(typeof err.message === 'string' ? err.message : 'Erro ao salvar jogo');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este jogo?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      loadGames(user.id);
    } catch (err) {
      setError('Erro ao excluir jogo');
    }
  }

  async function toggleFavorite(game) {
    try {
      await fetch(`${API_URL}/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !game.favorite }),
      });
      loadGames(user.id);
    } catch (err) {
      setError('Erro ao atualizar favorito');
    }
  }

  async function setRatingDirect(game, newRating) {
    try {
      await fetch(`${API_URL}/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      });
      loadGames(user.id);
    } catch (err) {
      setError('Erro ao atualizar nota');
    }
  }

  const visibleGames = useMemo(() => {
    let list = [...games];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.name?.toLowerCase().includes(term) ||
          g.platform?.toLowerCase().includes(term) ||
          (g.genres || []).some((x) => x.toLowerCase().includes(term))
      );
    }

    if (genreFilter) {
      list = list.filter((g) => (g.genres || []).includes(genreFilter));
    }

    if (statusFilter) {
      list = list.filter((g) => g.status === statusFilter);
    }

    if (favoriteOnly) {
      list = list.filter((g) => g.favorite);
    }

    return list;
  }, [games, search, statusFilter, favoriteOnly, genreFilter]);

  function exportCSV() {
    const header = ['Nome', 'Plataforma', 'Status', 'Gênero', 'Horas jogadas', 'Nota', 'Favorito', 'Concluído em'];
    const rows = visibleGames.map((g) => [
      g.name,
      g.platform,
      g.status,
      (g.genres || []).join(' / '),
      g.hoursPlayed,
      g.rating,
      g.favorite ? 'Sim' : 'Não',
      g.completedAt ? g.completedAt.slice(0, 10) : '',
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((field) => `"${(field ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jogos.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!checkedAuth) {
    return null;
  }

  return (
    <div className="container">
      <Nav />

      <div className="page-header">
        <h1>Meus jogos</h1>
        <button onClick={() => { setShowForm(!showForm); if (showForm) cancelEdit(); }}>
          {showForm ? 'Fechar' : '+ Adicionar jogo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <label>Nome do jogo</label>
          <div style={{ position: 'relative' }}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((item, i) => (
                  <div key={i} onClick={() => pickSuggestion(item)} className="suggestion-item">
                    {item.image && <img src={item.image} alt="" style={{ width: 40, height: 'auto' }} />}
                    <span style={{ fontSize: 13 }}>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {fetchingDetails && <div style={{ fontSize: 12, marginTop: 4 }}>Buscando gênero e descrição...</div>}
          {form.imageUrl && (
            <div style={{ marginTop: 8 }}>
              <img src={form.imageUrl} alt="capa selecionada" style={{ width: 140, border: '1px solid #000' }} />
            </div>
          )}

          <label>Plataforma</label>
          <select name="platform" value={form.platform || ''} onChange={handleChange}>
            <option value="">Selecione...</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <label>Status</label>
          <select name="status" value={form.status || ''} onChange={handleChange}>
            <option value="">Selecione...</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label>Gêneros (pode marcar mais de um)</label>
          <div className="chip-row">
            {GENRES.map((g) => (
              <button
                type="button"
                key={g}
                className={form.genres.includes(g) ? 'chip chip-on' : 'chip'}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <label>Descrição do jogo (sobre o que ele é)</label>
          <textarea
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            rows={3}
            readOnly={!!form.fromCatalog}
            className={form.fromCatalog ? 'locked-field' : ''}
            placeholder="Escolha o jogo nas sugestões pra preencher sozinho, ou escreva na mão"
          />
          {form.fromCatalog && (
            <div className="field-hint">🔒 Descrição vinda do catálogo, não pode ser editada. Sua opinião fica no campo abaixo.</div>
          )}

          <label>Sua opinião (nota, considerações pessoais)</label>
          <textarea
            name="review"
            value={form.review || ''}
            onChange={handleChange}
            rows={3}
            placeholder="O que você achou do jogo, recomendaria, pontos fortes/fracos..."
          />

          <label>Horas jogadas</label>
          <input type="number" min="0" name="hoursPlayed" value={form.hoursPlayed} onChange={handleChange} />

          <label>Data de conclusão (opcional)</label>
          <input type="date" name="completedAt" value={form.completedAt || ''} onChange={handleChange} />

          <label style={{ marginTop: 10 }}>Sua nota</label>
          <div style={{ marginTop: 2 }}>
            <FormStars value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>

          <label className="checkbox-label" style={{ marginTop: 12 }}>
            <input type="checkbox" name="favorite" checked={!!form.favorite} onChange={handleChange} />
            Favorito
          </label>

          <div className="form-buttons">
            <button type="submit">{editing ? 'Salvar alterações' : 'Adicionar jogo'}</button>
            <button type="button" className="secondary" onClick={cancelEdit} style={{ marginLeft: 8 }}>
              Cancelar
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </form>
      )}

      <div className="toolbar">
        <input
          placeholder="Buscar por nome, plataforma ou gênero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">Todos os gêneros</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <label className="checkbox-label" style={{ fontSize: 14 }}>
          <input type="checkbox" checked={favoriteOnly} onChange={(e) => setFavoriteOnly(e.target.checked)} />
          Só favoritos
        </label>
        <button type="button" className="secondary" onClick={exportCSV}>Exportar CSV</button>
      </div>

      <p style={{ fontSize: 14 }}>
        Mostrando <strong>{visibleGames.length}</strong> de <strong>{games.length}</strong> jogos
      </p>

      {visibleGames.length === 0 ? (
        <div className="empty">Nenhum jogo encontrado. Clica em "+ Adicionar jogo" pra começar.</div>
      ) : (
        <div className="game-grid">
          {visibleGames.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              onEdit={startEdit}
              onDelete={handleDelete}
              onToggleFavorite={toggleFavorite}
              onRate={setRatingDirect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
