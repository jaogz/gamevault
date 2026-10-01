function Stars({ value, onChange, readOnly }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="stars">
      {stars.map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange && onChange(n === value ? 0 : n)}
          className={readOnly ? 'star star-readonly' : 'star'}
          style={{ color: n <= value ? '#000' : '#ccc' }}
        >
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

export default function GameCard({ game, readOnly, onEdit, onDelete, onToggleFavorite, onRate, onAddToLibrary }) {
  return (
    <div className="game-card">
      <div className="game-cover">
        {game.imageUrl ? (
          <img src={game.imageUrl} alt={game.name} />
        ) : (
          <div className="game-cover-placeholder">{game.name?.charAt(0) || '?'}</div>
        )}
        {game.favorite && <span className="favorite-badge">★</span>}
      </div>

      <div className="game-body">
        <div className="game-title" title={game.name}>{game.name}</div>

        <div className="game-tags">
          {game.platform && <span className="tag">{game.platform}</span>}
          {game.status && <span className="tag tag-status">{game.status}</span>}
          {game.genre && <span className="tag">{game.genre}</span>}
        </div>

        {game.description && (
          <div className="game-text-block">
            <span className="game-text-label">Sobre o jogo</span>
            <p className="game-description">{game.description}</p>
          </div>
        )}

        {game.review && (
          <div className="game-text-block">
            <span className="game-text-label">Opinião</span>
            <p className="game-description">{game.review}</p>
          </div>
        )}

        <div className="game-meta">
          <Stars value={game.rating || 0} onChange={onRate ? (v) => onRate(game, v) : undefined} readOnly={readOnly || !onRate} />
          {game.hoursPlayed != null && <span className="hours">{game.hoursPlayed}h</span>}
        </div>

        {!readOnly && (
          <div className="game-actions">
            <button onClick={() => onToggleFavorite(game)} className="secondary">
              {game.favorite ? 'Desfavoritar' : 'Favoritar'}
            </button>
            <button onClick={() => onEdit(game)} className="secondary">Editar</button>
            <button onClick={() => onDelete(game.id)} className="danger">Excluir</button>
          </div>
        )}

        {readOnly && onAddToLibrary && (
          <div className="game-actions">
            <button onClick={() => onAddToLibrary(game)} className="secondary">
              + Adicionar à minha biblioteca
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
