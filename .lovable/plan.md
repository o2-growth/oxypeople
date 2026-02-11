

# Vincular ao Database Pipefy 302308200

## Resumo

Atualizar a integracão Pipefy para buscar dados do database `302308200` (URL: `app.pipefy.com/apollo_databases/302308200`) em vez do database atual `_XuxdWOx`. Nenhuma alteração de código na query GraphQL é necessária -- o `table_records` já aceita IDs numéricos.

## Etapas

### 1. Atualizar o table_id na configuração

Executar um UPDATE na tabela `pipefy_sync_config` trocando o `table_id` de `_XuxdWOx` para `302308200`.

### 2. Buscar os campos do novo database

Chamar a Edge Function `pipefy-tables` passando a organização `300622704` para listar os databases disponíveis e confirmar que `302308200` aparece com seus campos.

Se o database nao aparecer na listagem da organizacao (pode ser de outra org), sera necessario buscar os campos diretamente via uma chamada GraphQL com o table_id `302308200`.

### 3. Refazer o mapeamento de campos

O novo database pode ter nomes de campos diferentes. Após obter a lista de campos, atualizar o `field_mapping` na `pipefy_sync_config` para associar corretamente os campos do novo database aos campos do sistema (email, full_name, position, department, hire_date, birth_date, employment_type).

### 4. Rodar sincronização de teste

Executar a sync para validar que os registros são importados corretamente do novo database.

---

## Detalhes Técnicos

- **Query GraphQL**: `table_records(table_id: $tableId)` -- o tipo `ID!` no GraphQL aceita strings numéricas, então `"302308200"` funciona normalmente
- **Tabela afetada**: `pipefy_sync_config` (UPDATE do campo `table_id` e `field_mapping`)
- **Edge Functions**: Nenhuma alteração necessária em `pipefy-sync` nem `pipefy-tables`
- **Risco**: Os 40 registros já importados do database anterior permanecerão intactos. Registros duplicados (mesmo e-mail) serão atualizados, não duplicados

