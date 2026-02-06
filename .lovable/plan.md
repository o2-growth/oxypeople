
# Corrigir Tamanho dos Icones da Sidebar

## Problema Real Identificado

O componente `SidebarMenuButton` em `sidebar.tsx` possui regras CSS que **sobrescrevem** qualquer tamanho de icone definido:

| Regra | Efeito |
|-------|--------|
| `[&>svg]:size-4` | Forca TODOS os icones para 16px |
| `group-data-[collapsible=icon]:!size-8` | Limita o botao a 32px quando colapsado |

Alem disso, a largura da sidebar colapsada e apenas `3rem` (48px), muito pequena para icones grandes.

---

## Solucao em 2 Partes

### Parte 1: Aumentar largura da sidebar colapsada

**Arquivo:** `src/components/ui/sidebar.tsx`

| Antes | Depois |
|-------|--------|
| `SIDEBAR_WIDTH_ICON = "3rem"` | `SIDEBAR_WIDTH_ICON = "4.5rem"` |

Isso aumenta de 48px para 72px, dando espaco para icones maiores.

### Parte 2: Remover limite de tamanho dos icones

**Arquivo:** `src/components/ui/sidebar.tsx`

Remover a regra `[&>svg]:size-4` e aumentar o container colapsado:

| Antes | Depois |
|-------|--------|
| `group-data-[collapsible=icon]:!size-8` | `group-data-[collapsible=icon]:!size-12` |
| `[&>svg]:size-4` | (remover) |

### Parte 3: Aplicar tamanho consistente nos icones

**Arquivo:** `src/components/layout/AppSidebar.tsx`

Manter os icones em `h-8 w-8` (32px) que agora funcionara corretamente.

---

## Resultado Esperado

- **Sidebar Expandida:** Icones de 32px com bastante espaco
- **Sidebar Colapsada:** Icones de 32px centralizados em container de 72px
- **Avatar do usuario:** Permanece proporcional (36px)
