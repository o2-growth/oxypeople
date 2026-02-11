
## Transformar Feed em Mural (Layout Pinterest)

Trocar o layout de feed vertical tradicional por um mural estilo Pinterest/Masonry, com cards de tamanhos variados organizados em colunas, criando uma experiencia visual mais dinamica e moderna.

---

### O que muda visualmente

- **Layout**: De lista vertical unica para grid masonry com 2-3 colunas (responsivo: 1 coluna mobile, 2 tablet, 3 desktop)
- **Cards**: Tamanhos variados conforme o conteudo (posts com imagem ficam maiores, posts curtos ficam compactos, reconhecimentos e celebracoes ganham destaque visual)
- **Header**: Titulo muda de "Feed" para "Mural" com subtitulo atualizado
- **Sidebar**: Muda de painel lateral fixo para uma barra horizontal de filtros/categorias acima do mural
- **Navegacao**: Nome no sidebar muda de "Feed" para "Mural"
- **Criar post**: Fica como card flutuante no topo ou acessivel via botao FAB (floating action button)

---

### Categorias visuais dos cards

Cada tipo de conteudo tera um estilo de card diferente no mural:

1. **Post simples** (texto) - Card compacto, altura minima
2. **Post com imagem** - Card maior, imagem em destaque ocupando mais espaco
3. **Celebracao** (com mencoes) - Card com borda colorida e banner gradiente
4. **Reconhecimento** - Card com destaque visual (emoji/badge proeminente)

---

### Implementacao Tecnica

**Arquivos modificados:**

1. **`src/pages/Feed.tsx`** - Reestruturar layout:
   - Remover grid `lg:grid-cols-[1fr_320px]` e sidebar lateral
   - Titulo "Feed" vira "Mural"
   - Adicionar barra de filtros horizontal (Todos, Celebracoes, Reconhecimentos, Com Imagens)
   - Mover widgets "Em Alta" e "Destaque do Mes" para cards dentro do proprio mural
   - Implementar grid masonry com CSS columns (`columns-1 sm:columns-2 lg:columns-3` com `break-inside-avoid`)

2. **`src/components/feed/FeedPost.tsx`** - Adaptar para card de mural:
   - Remover animacao `animate-slide-up`
   - Adicionar `break-inside-avoid mb-4` para funcionar no masonry
   - Ajustar tamanho das imagens para preencher o card de forma proporcional
   - Compactar footer de acoes (reacao, comentario) para caber em cards menores

3. **`src/components/feed/CreatePost.tsx`** - Compactar para caber como primeiro card do mural ou manter como secao fixa acima do grid

4. **`src/components/layout/AppSidebar.tsx`** - Renomear item "Feed" para "Mural" na navegacao

**Nenhum arquivo novo necessario** - A implementacao usa CSS columns nativo, sem necessidade de biblioteca extra de masonry.

**Nenhuma alteracao no banco de dados** - Os mesmos hooks e queries existentes continuam funcionando.

---

### Detalhes do layout masonry com CSS

```text
+------------------------------------------+
|  Mural                                   |
|  [Todos] [Celebracoes] [Reconhec.] [Img] |
+------------------------------------------+
|  Col 1      |  Col 2      |  Col 3       |
|  +--------+ |  +--------+ |  +--------+  |
|  | Criar  | |  | Post c/| |  | Em Alta|  |
|  | Post   | |  | imagem | |  | widget |  |
|  +--------+ |  |        | |  +--------+  |
|  +--------+ |  |        | |  +--------+  |
|  | Post   | |  +--------+ |  | Post   |  |
|  | texto  | |  +--------+ |  | celebr.|  |
|  +--------+ |  | Reconh.| |  |        |  |
|  +--------+ |  +--------+ |  +--------+  |
|  | Destaqu| |             |              |
|  | do Mes | |             |              |
|  +--------+ |             |              |
+------------------------------------------+
```

A tecnica `CSS columns` com `break-inside: avoid` distribui os cards automaticamente entre as colunas, sem JavaScript, mantendo performance otima. Cards com mais conteudo (imagens, celebracoes) naturalmente ocupam mais espaco vertical, criando o efeito Pinterest.

### Filtros

Os filtros na barra horizontal usarao o array de posts ja carregado, filtrando no cliente:
- **Todos**: mostra tudo
- **Celebracoes**: posts com `metadata.mentions`
- **Reconhecimentos**: posts com `metadata.type === "recognition"`
- **Com Imagens**: posts com `metadata.images.length > 0`
