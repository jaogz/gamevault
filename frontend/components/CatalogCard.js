import Link from 'next/link';
import { gameLink } from '../lib/constants';

// Card de um jogo "da comunidade" (agrupa a cópia de todos os usuários).
export default function CatalogCard({ item }) {
  return (
    <Link href={gameLink(item.name)} className="catalog-card">
      <div className="catalog-cover">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="game-cover-placeholder">{item.name?.charAt(0) || '?'}</div>}
      </div>
      <div className="catalog-body">
        <div className="game-title" title={item.name}>{item.name}</div>
        <div className="catalog-meta">
          <span>{item.avgRating != null ? `★ ${item.avgRating.toFixed(1)}` : 'Sem notas'}</span>
          <span>{item.playerCount} {item.playerCount === 1 ? 'jogador' : 'jogadores'}</span>
        </div>
        {item.genres?.length > 0 && (
          <div className="game-tags">
            {item.genres.slice(0, 3).map((g) => (
              <span key={g} className="tag">{g}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
