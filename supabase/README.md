# Configuração do Supabase

## 1. Configurar o cliente

Em `js/supabase-config.js`, preencha a Project URL e a chave `anon`/public, disponível em `Project Settings > API`. Essa chave pode ficar no navegador porque as permissões são aplicadas no banco pelas políticas RLS. Nunca use a chave `service_role` no frontend.

## 2. Criar as tabelas e políticas

Execute todo o conteúdo de `supabase/schema.sql` no SQL Editor do projeto Supabase. O script cria as tabelas necessárias, migra as tabelas operacionais existentes para incluir `filial_id` e substitui o acesso anônimo por políticas RLS para usuários autenticados.

Os registros existentes ficam sem filial após a migração e não são exibidos para nenhum usuário até serem associados corretamente. Se todos os dados atuais pertencerem a uma única filial, siga o passo 5 para atribuí-los. Se houver dados de várias filiais, classifique e atualize cada registro pela sua filial antes de liberar o sistema; não atribua os dados inteiros a cada filial.

## 3. Cadastrar filiais

No SQL Editor, cadastre uma linha por filial:

```sql
insert into public.filiais (nome)
values ('Nome da filial')
returning id, nome;
```

Guarde o UUID retornado para usar nos próximos passos.

## 4. Criar usuários e associar a filial

1. No painel do Supabase, abra `Authentication > Users` e crie um usuário para cada funcionário. Não habilite cadastro público.
2. Copie o UUID do usuário criado.
3. No SQL Editor, associe o usuário a uma única filial:

```sql
insert into public.perfis (id, filial_id)
values ('UUID-DO-USUARIO', 'UUID-DA-FILIAL');
```

Repita para cada usuário. A aplicação não permite acesso a contas sem associação em `public.perfis`.

## 5. Migrar registros que já existiam

Use somente se **todos** os registros sem filial pertencerem à filial identificada. Substitua o UUID pelo identificador dessa filial:

```sql
update public.clientes
set filial_id = 'UUID-DA-FILIAL'
where filial_id is null;

update public.transportadoras
set filial_id = 'UUID-DA-FILIAL'
where filial_id is null;

update public.motoristas
set filial_id = 'UUID-DA-FILIAL'
where filial_id is null;

update public.notas
set filial_id = 'UUID-DA-FILIAL'
where filial_id is null;
```

Para bases com várias filiais, faça as atualizações com filtros que identifiquem os registros corretos de cada filial. Não compartilhe registros de uma filial com outra.

## Como funciona o isolamento

- O login usa e-mail e senha do Supabase Auth.
- Cada usuário possui uma única `filial_id` em `public.perfis`.
- Notas, clientes, transportadoras e motoristas recebem essa filial automaticamente.
- As políticas RLS validam a filial no banco em todas as leituras e gravações. Esconder dados apenas na interface não é usado como controle de acesso.
- Sem filial associada, o usuário não consegue consultar nem modificar os dados operacionais.
