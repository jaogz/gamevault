export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox', 'Switch', 'Mobile'];
export const STATUSES = ['Jogando', 'Zerado', 'Quero jogar', 'Abandonado'];
export const GENRES = [
  'Ação',
  'Aventura',
  'RPG',
  'Estratégia',
  'Simulação',
  'Esporte',
  'Corrida',
  'Puzzle',
  'Tiro',
  'Terror',
  'Luta',
  'Plataforma',
  'Indie',
  'Multijogador',
  'Mundo aberto',
  'Sobrevivência',
  'Outro',
];

export function gameLink(name) {
  return `/game?name=${encodeURIComponent(name)}`;
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia(s)`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}
