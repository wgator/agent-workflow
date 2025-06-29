feat: migração do frontend de ambiente estático para dinâmico com Vite

## Resumo da Migração
- Migração de setup estático HTML/CDN para sistema de build Vite + Vue 3
- Substituição do PrimeVue baseado em CDN por gerenciamento de pacotes npm
- Implementação de módulos ES6 adequados e desenvolvimento com hot-reload

## Arquitetura do Frontend
- **Sistema de Build**: Vite com suporte a Vue 3 SFC
- **Framework UI**: PrimeVue 4 com tema Aura
- **Gerenciamento de Estado**: Pinia store (planejado)
- **Drag & Drop**: vuedraggable@4.1.0 (solução funcional)
- **Sistema de Módulos**: Imports ES6 com tree shaking

## Refatoração de Componentes
- Extraído cards de estatísticas para componente reutilizável ProjectStatsCard
- Criada camada de serviços para melhor organização do código:
  - `services/taskApi.js` - Comunicação com API
  - `services/kanbanManager.js` - Lógica de negócio do Kanban
  - `services/backlogUtils.js` - Utilitários do Backlog
- Redução do KanbanView de ~400 para ~200 linhas (50% de redução)

## Experiência de Desenvolvimento
- ⚡ Hot-reload instantâneo
- 🎯 Módulos ES6 com imports adequados
- 📦 Tree shaking para bundles otimizados
- 🧪 Framework de testes Vitest pronto
- 🔧 Ferramentas de qualidade ESLint + Prettier

## Melhorias Técnicas
- Resolvidos problemas de compatibilidade do vue-draggable-next
- Implementado drag & drop adequado com suporte nativo ao Vue 3
- Separação limpa de responsabilidades com camada de serviços
- Removido boilerplate e dependências não utilizadas

## Estrutura de Arquivos
```
frontend/
├── src/
│   ├── components/     # Componentes UI reutilizáveis
│   ├── views/          # Componentes de nível de página
│   ├── services/       # Camada de lógica de negócio
│   └── assets/         # Assets estáticos
├── package.json        # Gerenciamento moderno de dependências
└── vite.config.js      # Configuração de build
```

A aplicação mantém funcionalidade completa enquanto oferece um ambiente
de desenvolvimento moderno, sustentável e escalável.
