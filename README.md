# Sistema de Expedição - Base Frontend

Esta pasta foi limpa para servir como ponto de partida da refatoração do frontend.

O que foi removido:

- Integração com Supabase
- Login e autenticação
- Dependências de banco de dados e sincronização em tempo real
- Referências de API e backend da documentação antiga

O que foi mantido:

- Estrutura HTML principal
- Estilos CSS
- Geração de PDF com `jsPDF`
- Lógica de interface em JavaScript

Estado atual:

- O sistema funciona somente no frontend
- Os registros são salvos localmente no navegador com `localStorage`
- Não existe mais dependência de backend nesta cópia

Arquivos principais:

- `index.html`
- `css/style.css`
- `js/script.js`
- `assets/`
- `vendor/`

Próximo passo sugerido:

1. Definir as novas telas e fluxos do frontend
2. Separar as novas regras de negócio que irão para o backend
3. Criar o backend novo sem reaproveitar a estrutura antiga
