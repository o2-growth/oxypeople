
## Remover Feed de Postagens do Mural

Eliminar completamente a funcionalidade de criar posts, comentar e reagir. O Mural passa a exibir apenas eventos, avisos fixados, calendario e destaques.

---

### O que sera removido

**Arquivos deletados (8 arquivos):**
- `src/components/feed/CreatePost.tsx`
- `src/components/feed/FeedPost.tsx`
- `src/components/feed/PostComments.tsx`
- `src/components/feed/EmojiPicker.tsx`
- `src/components/feed/ImageUpload.tsx`
- `src/components/feed/MentionRenderer.tsx`
- `src/components/feed/MentionSelector.tsx`
- `src/components/feed/SlackChannelSelector.tsx`
- `src/hooks/usePosts.ts`

**Arquivo modificado:**
- `src/pages/Feed.tsx` - Remover imports de `CreatePost`, `FeedPost`, `usePosts` e todo o bloco do feed (linhas 63-107). A coluna esquerda ficara apenas com `PinnedAnnouncements` e um estado vazio informativo caso nao haja avisos.

---

### Resultado final do Mural

A pagina tera:
1. Header com titulo + botao de criar evento (admins)
2. Carrossel de proximos eventos
3. Coluna principal: Avisos fixados (sem feed de posts)
4. Sidebar: Mini calendario, aniversariantes, destaques do mes

Nenhuma alteracao no banco de dados necessaria.
