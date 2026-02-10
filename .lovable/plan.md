
## Mapa de Objetivos - Layout Vertical

### Problema
Atualmente o mapa renderiza os objetivos de forma **horizontal** (pai a esquerda, filhos a direita). A solicitacao e mudar para um layout **vertical** (pai em cima, filhos embaixo), como um organograma classico.

### Mudancas

**Arquivo: `src/components/objectives/ObjectiveMapNode.tsx`**

Refatorar o componente `ObjectiveMapNode` para usar layout vertical:

- Trocar o container principal de `flex items-start` (horizontal) para `flex flex-col items-center` (vertical)
- O conector entre pai e filhos passa de **horizontal** (`w-8 h-px`) para **vertical** (`h-8 w-px`)
- Os filhos passam a ser dispostos em `flex flex-row` (lado a lado, abaixo do pai) em vez de `flex flex-col`
- Conectores de branch mudam de linhas horizontais para verticais (de cima para baixo)
- A linha que conecta os irmaos passa de vertical para **horizontal** (ligando os filhos entre si na mesma linha)

**Arquivo: `src/components/objectives/ObjectivesMap.tsx`**

- Ajustar o container interno de `flex flex-col gap-10` para `flex flex-row gap-10` ou manter `flex-col` com alinhamento centralizado, para que multiplas arvores raiz fiquem organizadas verticalmente uma abaixo da outra com os nos centralizados

### Resultado Visual

```text
        [Estrategico]
             |
      ───────┼───────
      |             |
  [Tatico 1]   [Tatico 2]
      |
  ──────────
  |        |
[Op 1]  [Op 2]
```

### Detalhes Tecnicos

- Container do no: `flex flex-col items-center`
- Conector pai-filhos: `w-px h-8 bg-border` (linha vertical para baixo)
- Filhos agrupados em: `flex flex-row items-start gap-6`
- Linha horizontal conectando irmaos: `h-px bg-border` posicionada absolutamente no topo dos filhos
- Cada branch filho tem um conector vertical curto (`w-px h-4`) antes do seu card
