import { BASE_URL } from './constants';

// GET que falha de verdade quando o servidor responde com erro (ex.: 500),
// em vez de devolver o JSON de erro como se fossem dados.
export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = typeof body.message === 'string' ? body.message : '';
    } catch (e) {
      // sem corpo JSON
    }
    throw new Error(`Erro ${res.status} em ${path}${detail ? ` (${detail})` : ''}`);
  }
  return res.json();
}

export const SERVER_ERROR_MSG =
  'Não consegui carregar os dados. O servidor pode estar acordando (espere cerca de 1 minuto e recarregue).';

// Texto pronto pra mostrar na tela: mensagem amigável + o motivo técnico.
export function describeError(err) {
  const detail = err && err.message ? ` [${err.message}]` : '';
  return `${SERVER_ERROR_MSG}${detail}`;
}
