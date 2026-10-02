# GameVault

Aplicação web para catalogar a biblioteca pessoal de jogos. Cada usuário cria o seu perfil (com foto, capa, bio e localização), cadastra os jogos que tem, avalia com estrelas, escreve sua opinião pessoal, marca favoritos, e pode visitar o perfil de outros usuários — inclusive copiando um jogo que viu na coleção de alguém direto para a própria biblioteca.

Projeto desenvolvido como **Atividade Final (MVP)** do componente **Programação IV** — Unoesc.

## Links

| O quê | Link |
|-------|------|
| Aplicação online | [COLE AQUI O LINK DO SITE NO RENDER] |
| API online | [COLE AQUI O LINK DO BACKEND NO RENDER] |
| Vídeo de apresentação | [COLE AQUI O LINK DO YOUTUBE] |

> O backend gratuito "dorme" depois de alguns minutos sem uso e demora cerca de 1 minuto pra acordar na primeira requisição. O site (frontend) é estático e fica sempre no ar. O banco de dados é um Postgres gratuito (Neon), então os dados não se perdem quando o backend dorme.

## Autor

- João Gabriel Zangalli — joao.z@unoesc.edu.br

## Tecnologias

- **Frontend:** Next.js (exportado como site estático)
- **Backend:** NestJS
- **Banco de dados:** PostgreSQL (hospedado gratuitamente no Neon)
- **ORM:** Prisma
- **Autenticação:** cadastro e login próprios, com senha protegida por hash (bcryptjs)
- **Integração externa:** busca pública da loja da Steam (nome, capa, gênero e descrição dos jogos)
- **Deploy:** Render (site estático + web service), banco no Neon

## Funcionalidades

- Cadastro e login de usuários (cada usuário tem a sua própria coleção)
- **Perfil personalizável:** foto, capa, bio e localização
- CRUD completo de jogos (criar, listar, editar e excluir)
- Autocompletar do jogo: ao digitar o nome, sugere jogos e preenche capa, gênero e descrição automaticamente
- **Descrição do jogo (sobre o que ele é) separada da sua opinião pessoal** (nota, considerações, recomendação)
- Avaliação por estrelas (1 a 5)
- Marcar jogos como favoritos
- Busca por nome, plataforma ou gênero, e filtro por status e por favoritos
- Exportação da lista em CSV
- Dashboard com total de jogos, horas jogadas, nota média e jogos por status
- **Tela inicial:** estatísticas da comunidade, jogos populares, mais bem avaliados, opiniões recentes e novos jogadores (e, logado, a atividade de quem você segue)
- **Explorar:** catálogo de todos os jogos da comunidade, com busca por nome, filtro por gênero e ordenação (populares, melhor avaliados, recentes, A-Z)
- **Página do jogo:** nota média da comunidade, distribuição das notas, opiniões de cada jogador e quem tem o jogo
- **Vários gêneros por jogo** (ex.: Ação + Aventura + Mundo aberto), com filtro por gênero na biblioteca e gráfico de gêneros no dashboard
- **Descrição do catálogo não editável:** quando o jogo vem da Steam (descrição em português), o texto é travado — a opinião pessoal é um campo separado
- **Busca de usuários** por nome ou localização, com ordenação
- **Seguir usuários** e feed de atividade na tela inicial
- **Perfis públicos:** visitar a coleção, favoritos, notas e opiniões de outros usuários
- **Adicionar à minha biblioteca:** copiar um jogo do perfil de outra pessoa direto pra sua própria coleção (a cópia vem só com os dados do jogo — nome, plataforma, gênero, descrição e capa; sua nota, opinião e status ficam em branco pra você preencher com a sua própria experiência)

## Modelo de dados

**User** — id, username (único), password (hash), avatarUrl, coverUrl, bio, location, createdAt. Relação 1:N com Game.

**Follow** — followerId, followingId, createdAt (quem segue quem). Relação N:N entre usuários.

**Game** — id, name, platform, status, **genres** (lista), genre (legado), **fromCatalog** (descrição travada), **description** (sobre o jogo), **review** (opinião pessoal), hoursPlayed, rating (1-5), favorite, imageUrl, completedAt, createdAt, userId (dono).

## Estrutura do repositório

```
gamevault/
  backend/    -> API NestJS
  frontend/   -> Interface Next.js (site estático)
  README.md
```

## Como rodar localmente

Pré-requisitos: **Node.js 18+** e uma connection string de um banco Postgres gratuito.

### 1. Banco de dados

Crie um banco gratuito em [neon.tech](https://neon.tech) (cria conta, New Project, copia a "Connection string" na tela do projeto, botão **Connect**). Cole no arquivo `backend/.env`:

```
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"
```

### 2. Backend

```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000`, clique em **Criar perfil** e comece a cadastrar jogos.

## Variáveis de ambiente

**Backend** (`backend/.env`): `DATABASE_URL` — connection string do Neon.

**Frontend** (`frontend/.env.local`): `NEXT_PUBLIC_API_URL` — URL do backend, sem barra no final.

## Rotas da API

### Usuários

| Método | Rota | Ação |
|--------|------|------|
| POST | /users/register | Criar perfil |
| POST | /users/login | Entrar |
| GET | /users | Listar perfis |
| GET | /users/:id | Buscar um perfil |
| PATCH | /users/:id | Editar perfil (foto, capa, bio, localização) |
| POST | /users/:id/follow | Seguir (body: `followerId`) |
| DELETE | /users/:id/follow?followerId=ID | Deixar de seguir |

`GET /users/:id?viewerId=ID` também devolve seguidores, seguindo e se o `viewerId` já segue o perfil.

### Jogos

| Método | Rota | Ação |
|--------|------|------|
| GET | /games?userId=ID | Listar jogos de um usuário |
| GET | /games/:id | Buscar um jogo |
| POST | /games | Criar jogo (ou copiar da biblioteca de outra pessoa) |
| PATCH | /games/:id | Editar jogo |
| DELETE | /games/:id | Excluir jogo |
| GET | /games/home | Dados da tela inicial (estatísticas, populares, mais bem avaliados, opiniões, novos usuários) |
| GET | /games/feed?userId=ID | Atividade de quem o usuário segue |
| GET | /games/catalog?q=&genre=&sort= | Catálogo da comunidade (`sort`: popular, rating, recent, name) |
| GET | /games/catalog/detail?name=NOME | Página do jogo: nota média, distribuição, opiniões |
| GET | /games/search-external?q=TEXTO | Buscar jogos na Steam (sugestões) |
| GET | /games/external-details?appid=ID | Buscar gênero e descrição na Steam |

## Deploy (tudo no Render)

**1. Banco (Neon)** — crie o projeto gratuito e copie a connection string.

**2. Backend (Render → New → Web Service)**
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/main.js`
- O banco (Neon) é ajustado automaticamente quando o backend inicia (colunas de gêneros e tabela de seguidores), então não precisa rodar migração no deploy. Abrir o endereço do backend no navegador mostra `schemaReady: true` quando está tudo certo.
- Environment: `DATABASE_URL` com a connection string do Neon

**3. Frontend (Render → New → Static Site)**
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `out`
- Environment: `NEXT_PUBLIC_API_URL` com a URL do backend (passo 2), sem barra no final

## Vídeo de apresentação

[COLE AQUI O LINK DO YOUTUBE]
