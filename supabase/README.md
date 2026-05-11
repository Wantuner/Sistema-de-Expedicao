# Supabase

## Criar o banco

1. Crie um projeto no Supabase.
2. Abra `SQL Editor`.
3. Cole e execute o conteudo de `supabase/schema.sql`.

## Conectar o sistema

1. No Supabase, abra `Project Settings > API`.
2. Copie a `Project URL`.
3. Copie a chave `anon public`.
4. Preencha `js/supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://seu-projeto.supabase.co",
  anonKey: "sua-chave-anon-public"
};
```

Enquanto esses campos estiverem vazios, o sistema continua usando `localStorage`.

## Observacao de seguranca

As politicas atuais liberam leitura e escrita para a chave anonima porque o sistema ainda nao tem login. Quando a autenticacao for criada, troque as policies por regras para usuarios autenticados.
