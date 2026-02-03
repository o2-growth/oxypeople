
## Plano: Adicionar Funcionalidade de Celebração com Menções no Feed

### Visão Geral
Adicionar ao feed a funcionalidade de celebrar colegas, departamentos ou toda a empresa através de menções (`@NomeDoColega`, `@NomeDoDepartamento`, `@todos`), permitindo criar posts de reconhecimento diretamente no feed.

### Mudanças a Realizar

#### 1. Criar Componente `MentionSelector`

**Novo arquivo:** `src/components/feed/MentionSelector.tsx`

Componente que exibe sugestões ao digitar `@`:
- Lista de pessoas da empresa (busca ao digitar `@` + nome)
- Lista de departamentos (busca ao digitar `@` + nome do departamento)
- Opção `@todos` para mencionar toda a empresa
- Popover posicionado abaixo do cursor

Interface:
```text
+------------------------+
| Pessoas                |
| 👤 João Silva          |
| 👤 Maria Santos        |
+------------------------+
| Departamentos          |
| 🏢 Marketing           |
| 🏢 Tecnologia          |
+------------------------+
| @todos                 |
+------------------------+
```

#### 2. Atualizar `CreatePost`

**Arquivo:** `src/components/feed/CreatePost.tsx`

Mudanças:
- Adicionar texto de placeholder/dica: "Você deve celebrar com um colega usando @NomeDoColega, com uma equipe usando @NomeDoDepartamento ou com todo mundo usando @todos"
- Detectar quando usuário digita `@` no textarea
- Exibir dropdown de sugestões baseado no texto após `@`
- Ao selecionar uma menção, inserir o texto no textarea
- Armazenar IDs das menções no metadata do post

#### 3. Atualizar `usePosts`

**Arquivo:** `src/hooks/usePosts.ts`

Mudanças:
- Adicionar parâmetro `mentions` ao `useCreatePost`:
  ```typescript
  mentions?: {
    users?: string[];      // IDs de usuários
    departments?: string[];// IDs de departamentos
    everyone?: boolean;    // Se menciona @todos
  }
  ```
- Salvar menções no campo `metadata` do post

#### 4. Criar Hook `useMentionSuggestions`

**Novo arquivo:** `src/hooks/useMentionSuggestions.ts`

Hook para buscar sugestões de menções:
- Buscar pessoas da empresa (reutilizar lógica do `MultiPersonSelector`)
- Buscar departamentos (reutilizar `useDepartmentsWithDetails`)
- Incluir opção `@todos`
- Filtrar por texto digitado

#### 5. Atualizar `FeedPost` para Exibir Menções

**Arquivo:** `src/components/feed/FeedPost.tsx`

Mudanças:
- Detectar menções no conteúdo do post (texto com `@`)
- Renderizar menções com destaque visual (cor diferente, clicável)
- Exibir banner especial quando é post de celebração

### Fluxo de Uso

1. Usuário clica no campo de texto do CreatePost
2. Vê o texto de dica sobre celebrações
3. Digita `@` e começa a escrever um nome
4. Dropdown aparece com sugestões filtradas
5. Seleciona uma pessoa, departamento ou `@todos`
6. Menção aparece no texto
7. Ao publicar, metadados são salvos com IDs das menções
8. Post aparece no feed com menções destacadas

### Seção Técnica

**Estrutura do metadata do post:**
```typescript
metadata: {
  images?: string[];
  mentions?: {
    users?: string[];        // Array de user IDs
    departments?: string[]; // Array de department IDs  
    everyone?: boolean;     // true se @todos
  }
}
```

**Detecção de menções no textarea:**
```typescript
const detectMentionTrigger = (text: string, cursorPosition: number) => {
  // Encontrar o @ mais próximo antes do cursor
  const beforeCursor = text.slice(0, cursorPosition);
  const atIndex = beforeCursor.lastIndexOf('@');
  
  if (atIndex === -1) return null;
  
  const afterAt = beforeCursor.slice(atIndex + 1);
  // Se não tem espaço após o @, está digitando menção
  if (!afterAt.includes(' ')) {
    return {
      trigger: true,
      searchText: afterAt,
      startIndex: atIndex
    };
  }
  return null;
};
```

**Inserção da menção:**
```typescript
const insertMention = (mention: string, startIndex: number) => {
  const before = content.slice(0, startIndex);
  const after = content.slice(textareaRef.current?.selectionStart || 0);
  const newContent = `${before}@${mention} ${after}`;
  setContent(newContent);
};
```

**Componentes reutilizados:**
- `Avatar` e `AvatarFallback` para exibir fotos
- `Popover` para dropdown de sugestões
- `Command` para lista pesquisável (igual ao MultiPersonSelector)
