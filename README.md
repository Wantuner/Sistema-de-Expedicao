# Sistema de Expedição

Aplicação web para lançamento e acompanhamento de notas de expedição. O acesso exige autenticação pelo Supabase; não há modo local alternativo. Os dados operacionais ficam no banco e são isolados por filial com Row Level Security (RLS).

## Configuração inicial

1. Configure a URL do projeto e a chave `anon`/public em `js/supabase-config.js`. Não coloque a chave `service_role` no navegador.
2. Execute `supabase/schema.sql` no SQL Editor do Supabase.
3. Cadastre as filiais e os usuários conforme o guia em [`supabase/README.md`](./supabase/README.md).
4. Crie as contas dos funcionários no Supabase Auth e associe cada usuário a exatamente uma filial na tabela `public.perfis`.
5. Desabilite o cadastro público de usuários no Supabase Auth. As contas devem ser provisionadas pelo administrador.

Sem a configuração do Supabase, ou sem uma filial associada ao usuário, o sistema não libera os dados.

## Arquivos principais

- `index.html`: interface, formulário de login e telas operacionais.
- `css/style.css`: estilos da aplicação.
- `js/script.js`: autenticação e lógica da aplicação.
- `js/supabase-config.js`: configuração pública do cliente Supabase.
- `supabase/schema.sql`: tabelas, permissões e políticas RLS por filial.
