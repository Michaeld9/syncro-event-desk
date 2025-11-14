# Sistema de Eventos - Setup Guide

## Arquitetura

Este projeto utiliza:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js com Express (API REST)
- **Database**: PostgreSQL local com Docker
- **Autenticação**:
  - Admin local (email/senha)
  - Google OAuth

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ instalado
- npm ou yarn

## Setup Inicial

### 1. Clonar e instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
VITE_API_URL=http://localhost:5173
DATABASE_URL=postgresql://app_user:app_password_secure_change_me@localhost:5432/event_calendar
JWT_SECRET=seu_secret_jwt_bem_seguro
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback
ADMIN_EMAIL=admin@app.local
ADMIN_PASSWORD=admin123
```

### 3. Iniciar o banco de dados PostgreSQL

```bash
docker-compose up -d
```

Isso vai:
- Iniciar o PostgreSQL na porta 5432
- Iniciar o pgAdmin na porta 5050 (opcional)
- Executar o script `init.sql` para criar tabelas e usuário admin

### 4. Verificar a conexão do banco

```bash
psql -h localhost -U app_user -d event_calendar
```

### 5. Instalar e rodar o projeto

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Credenciais Padrão

### Admin (Local)
- Email: `admin@app.local`
- Senha: `admin123`

### Google OAuth

Para usar Google OAuth:

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a API do Google+
4. Crie credenciais OAuth 2.0 (Application Web)
5. Configure as URIs autorizadas:
   - `http://localhost:5173`
   - `http://localhost:5173/auth/google/callback`
6. Copie o Client ID e Client Secret para o `.env`

## Parar o banco de dados

```bash
docker-compose down
```

## Estrutura do Projeto

```
src/
├── pages/              # Páginas da aplicação
│   ├── Auth.tsx        # Login/Autenticação
│   ├── Dashboard.tsx   # Lista de eventos
│   ├── Approvals.tsx   # Aprovações (admin)
│   └── CalendarView.tsx # Visualização em calendário
├── components/         # Componentes reutilizáveis
├── server/             # Serviços de backend
│   ├── db.ts           # Conexão PostgreSQL
│   ├── auth.ts         # Autenticação e JWT
│   └── events.ts       # Operações de eventos
└── integrations/
    └── api.ts          # Cliente HTTP para APIs
```

## Banco de Dados

### Tabelas

- **users**: Usuários (admin local + Google OAuth)
- **events**: Eventos com status (pending, approved, rejected)

### Tipos de Roles

- `admin`: Acesso total, pode aprovar/rejeitar eventos
- `supervisor`: Pode aprovar/rejeitar eventos
- `coordenador`: Pode criar eventos (padrão)

## Desenvolvimento

### Adicionar nova página

1. Criar arquivo em `src/pages/NomePage.tsx`
2. Importar em `src/App.tsx` e adicionar rota
3. Proteger com `<ProtectedRoute>` se necessário

### Adicionar novo endpoint de API

1. Adicionar função em `src/server/http.ts`
2. Adicionar método correspondente em `src/integrations/api.ts`
3. Usar em componentes com `import { eventsApi } from '@/integrations/api'`

### Banco de dados

Para adicionar migrations:

1. Criar arquivo SQL em `supabase/migrations/`
2. Executar manualmente via `psql` ou através da interface do pgAdmin

## Troubleshooting

### Erro de conexão com banco

```bash
# Verificar se container está rodando
docker-compose ps

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose down && docker-compose up -d
```

### Admin não consegue fazer login

1. Verificar se usuário está na tabela `users`:
   ```sql
   SELECT * FROM users WHERE email = 'admin@app.local';
   ```

2. Resetar senha (gerar novo hash bcrypt)

### Google OAuth não funciona

- Verificar se Client ID está correto no `.env`
- Verificar se redirect URI está registrado no Google Console
- Verificar se porta 5173 está acessível

## Build para Produção

```bash
npm run build
```

Isso vai gerar a versão otimizada em `dist/`

## Próximos Passos

- [ ] Integração com Google Calendar para sincronizar eventos
- [ ] Sistema de notificações por email
- [ ] Relatórios e estatísticas
- [ ] Controle de permissões mais granular
