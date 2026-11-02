# Remix of Rd4x Command Garden

Crie um dashboard administrativo premium chamado RD4X Dashboard V10.



Quero um frontend completo, moderno e responsivo, com visual dark/futurista, elegante e profissional. Não crie backend, banco de dados, OAuth ou autenticação real. Use apenas dados mockados e deixe a arquitetura preparada para conectar uma API externa posteriormente.



Páginas:



- Login Discord

- RD4X Key

- Overview

- Users

- Tickets

- Releases

- Incidents

- Statistics

- Audit

- Transcripts

- Search

- Settings



Layout principal:

- Sidebar moderna e recolhível

- Topbar

- Breadcrumb

- Busca global

- Avatar e menu do usuário

- Sistema de notificações

- Toasts

- Modais

- Loading skeletons

- Empty states

- Error states



Overview:

- Total Users

- Active Users

- Total Executions

- Success Rate

- Open Tickets

- Active Keys

- Gráfico de executions

- Recent Activity

- Recent Tickets

- System Health



Users:

- Resumo de usuários

- Busca e filtros

- Tabela com avatar, username, Discord ID, role, status, keys e última atividade

- Modal de detalhes do usuário



Tickets:

- Open, Pending, Resolved e High Priority

- Busca/filtros

- Lista de tickets

- Tela de conversa estilo chat

- Prioridade e status

- Ações para responder, fechar e atribuir



Releases:

- Versão atual

- Última release

- Total de releases

- Timeline de versões

- Modal para criar release



Incidents:

- Incidentes ativos

- Resolvidos

- Uptime

- Timeline de incidentes

- Severidade e status



Statistics:

- Executions

- Success vs Failure

- Active Users

- API Response Time

- Gráficos de linha, área, barras e donut

- Filtros 24H, 7D, 30D, 90D



Audit:

- Log de ações administrativas

- Timestamp

- User

- Action

- Target

- Status

- Busca e filtros



Transcripts:

- Lista de conversas arquivadas

- Busca

- Visualização de transcript em formato de chat



Search:

- Busca global por Users, Tickets, Keys, Releases e Audit Events

- Resultados agrupados por categoria



Settings:

- General

- Profile

- Security

- Notifications

- Appearance

- System



Tela RD4X Key:

- Card central premium

- Logo RD4X

- Campo RD4X-XXXX-XXXX-XXXX

- Botão Continue

- Estados Loading, Invalid, Expired e Success

- Mostrar Discord conectado



Design:

- Dark mode

- Fundo sofisticado

- Cards com bordas discretas

- Cantos arredondados

- Tipografia moderna

- Ícones consistentes

- Animações sutis

- Excelente espaçamento

- Sem excesso de gradientes ou neon



Responsividade:

Desktop, tablet e celular.

No celular a sidebar deve virar menu lateral e todos os cards/tabelas/gráficos devem se adaptar perfeitamente.



Crie componentes reutilizáveis para:

Sidebar, Topbar, StatCard, DataTable, Badge, Modal, Toast, Notification, ChartCard, SearchBar, FilterBar, LoadingSkeleton, EmptyState e ErrorState.



Use mock data centralizado e uma camada de API mockada com funções como:

getOverview(), getUsers(), getTickets(), getReleases(), getIncidents(), getStatistics(), getAudit(), getTranscripts(), search() e getSettings().



O resultado deve parecer um dashboard SaaS real pronto para produção, não uma landing page.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d30d3d41-950f-47a2-816a-245696f14b6f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
