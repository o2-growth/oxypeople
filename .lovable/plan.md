

# Aumentar Tamanho dos Icones da Sidebar

## Problema Identificado

Os icones de navegacao na sidebar estao com apenas 22px (`h-[22px] w-[22px]`), o que os deixa pequenos e "esmagados" quando a sidebar esta recolhida.

## Solucao

Aumentar os icones para um tamanho mais confortavel de **24px** (`h-6 w-6`) que fica proporcional ao icone do O2 e melhora a legibilidade.

---

## Alteracao Planejada

**Arquivo:** `src/components/layout/AppSidebar.tsx`

**Linha 124:**

| Antes | Depois |
|-------|--------|
| `h-[22px] w-[22px]` | `h-6 w-6` |

Codigo atualizado:
```tsx
<item.icon className="h-6 w-6 shrink-0" />
```

Isso muda o tamanho de 22px para 24px, que e o proximo tamanho padrao do Tailwind e deixa os icones mais visiveis e proporcionais ao icone do O2 na sidebar.

---

## Resultado Visual Esperado

**Sidebar Expandida:**
- Icones maiores e mais legives
- Melhor proporcao com o texto ao lado

**Sidebar Recolhida:**
- Icones nao ficam mais "esmagados"
- Melhor aproveitamento do espaco do container
- Visual mais equilibrado com o icone O2

