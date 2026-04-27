# Coding Standards — oxypeople

> Regras práticas extraídas dos padrões já em uso. Toda story nova deve seguir isto.

## TypeScript

- **Strict mode** habilitado (já no `tsconfig.json`)
- **Sem `any`** salvo casos extremos comentados
- **Types from Zod**: `type FormData = z.infer<typeof schema>` — não duplicar
- **Tipos de DB**: `Database['public']['Tables']['x']['Row']` (gerado, não escrever à mão)

```typescript
// ✅ bom
import type { Database } from "@/integrations/supabase/types";
type Objective = Database["public"]["Tables"]["objectives"]["Row"];

// ❌ ruim
type Objective = { id: string; title: string; /* ... */ };
```

## React Query

### Convenções de keys

```typescript
// Resource list por empresa
queryKey: ["objectives", companyId, userId]

// Subtype/filter
queryKey: ["objectives", "filtered", companyId, filters]

// Detail
queryKey: ["objectives", "detail", objectiveId]
```

### Padrão de hook

```typescript
export function useObjectives() {
  const { user } = useAuth();
  const { data: companyId } = useCompanyId();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["objectives", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return [];
      const { data, error } = await supabase
        .from("objectives")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!user?.id,
  });

  const create = useMutation({
    mutationFn: async (input: CreateInput) => {
      const { data, error } = await supabase
        .from("objectives")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("Objetivo criado");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  return { ...list, create };
}
```

### Regras
- Sempre `enabled: !!companyId && !!user?.id` em queries multi-tenant
- Sempre `throw error` (não retornar `{ error }`)
- `onSuccess` invalida **broad** (não otimista por padrão)
- Mensagens de toast em **PT-BR**

## Forms (react-hook-form + Zod)

```typescript
const schema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  type: z.enum(["strategic", "tactical", "operational"]),
  targetValue: z.coerce.number().min(0.01, "Valor inválido"),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ },
});

const onSubmit = async (data: FormData) => {
  await create.mutateAsync(data);
  form.reset();
  onClose();
};
```

### Regras
- Schema **dentro do componente** ou em arquivo dedicado, nunca global
- Mensagens de validação em PT-BR
- `z.coerce.number()` para inputs numéricos
- `useFieldArray` para listas dinâmicas
- Submit só faz `mutateAsync` — **não fazer call direto Supabase fora de hook**

## Componentes

### Estrutura de página
```typescript
export default function MyPage() {
  // 1. State local
  const [isOpen, setIsOpen] = useState(false);
  
  // 2. Hooks (data, auth, permissions)
  const { data, isLoading } = useMyData();
  const { isAdmin } = useUserPermissions();
  
  // 3. Render helpers
  const renderContent = () => {
    if (isLoading) return <Skeleton />;
    if (!data?.length) return <EmptyState />;
    return <MyList items={data} />;
  };

  return (
    <AppLayout>
      <PageHeader title="Minha Página">
        {isAdmin && <Button onClick={() => setIsOpen(true)}>Novo</Button>}
      </PageHeader>
      <div>{renderContent()}</div>
      <CreateDialog open={isOpen} onOpenChange={setIsOpen} />
    </AppLayout>
  );
}
```

### Regras
- **Sempre** `<AppLayout>` wrapper
- **3-state rendering**: loading → empty → content (sem misturar)
- Modais **controlled** (`open` + `onOpenChange`)
- **Não** importar de `src/components/ui/*` em outro `src/components/ui/*` (evitar dependência circular)

## RLS Policies (SQL)

### Padrão
```sql
-- Sempre 4 policies separadas (não FOR ALL)
CREATE POLICY "Members can view X"
ON public.x FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Members can create X"
ON public.x FOR INSERT
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
  AND created_by = auth.uid()
);

CREATE POLICY "Owner or admin can update X"
ON public.x FOR UPDATE
USING (
  owner_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
);

CREATE POLICY "Owner or admin can delete X"
ON public.x FOR DELETE
USING (
  owner_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
);
```

### Regras
- **Habilitar RLS em TODA tabela nova** (`ENABLE ROW LEVEL SECURITY`)
- 4 policies separadas (SELECT/INSERT/UPDATE/DELETE), nunca `FOR ALL`
- Usar helpers existentes: `is_company_member`, `is_company_admin`, `is_team_leader`, `is_user_manager` (novo, ver migration 0001)
- `WITH CHECK` em INSERT/UPDATE para forçar tenant correto
- **Sempre** `DROP POLICY IF EXISTS` antes de `CREATE POLICY` (idempotência)

## Migrations

- **NUNCA destrutivas** sem aprovação explícita do usuário (regra global)
- **Sempre** idempotentes: `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`
- **Aditivas only**: `ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`, `CREATE POLICY`
- **Numerar e renomear** com timestamp ao mover de `docs/migrations-draft/` para `supabase/migrations/`

## Edge Functions (Deno)

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // ... lógica
    
    return new Response(
      JSON.stringify({ success: true, data: {} }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Regras
- **OPTIONS preflight** sempre
- **Service role key** (não anon) para operações admin
- **Response shape**: `{ success: boolean, data?: T, error?: string }`
- **`console.error`** para vai para Supabase Logs (sem lib)

## Realtime

```typescript
useEffect(() => {
  if (!objectiveId) return;
  
  const channel = supabase
    .channel(`objective-${objectiveId}-comments`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "objective_comments",
        filter: `objective_id=eq.${objectiveId}`,
      },
      () => {
        queryClient.invalidateQueries({
          queryKey: ["objective-comments", objectiveId],
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [objectiveId, queryClient]);
```

### Regras
- Channel name **único e descritivo**
- **Sempre** `removeChannel` no cleanup (sem isso = leak)
- **Não** mutar estado direto — só invalidate React Query

## Comentários no código

> **Default: não escrever comentário.** Identificadores bem nomeados já explicam.

Escreva comentário **apenas** se:
- Explica **POR QUÊ** (não O QUÊ) algo é feito de forma não-óbvia
- Workaround para bug específico
- Constraint invisível ou regra de negócio peculiar
- TODO/FIXME com referência a issue/story

```typescript
// ❌ ruim
// itera os objetivos
objectives.forEach(...)

// ✅ bom
// Aspirational não conta para média geral (PRD epic 1.4)
const committed = objectives.filter(o => o.commitment_type === "committed");
```

## Lint & Format

- ESLint config em `eslint.config.js` (não modificar sem PR de discussão)
- Prettier implícito via shadcn defaults
- Antes de PR: `bun run lint` deve passar sem warning

## Erros comuns a evitar

| Erro | Por quê é ruim | Faça |
|---|---|---|
| `useEffect` para fetch | Use React Query | `useQuery` |
| `useState` para data do server | Idem | `useQuery` |
| `try/catch` em hook silenciando erro | Quebra error boundary | `throw error` no `queryFn` |
| Componente sem export default em `pages/` | React Router quebra | sempre `export default` em página |
| Importar shadcn de outro shadcn | Dependência circular | importar de `src/components/<modulo>/` |
| RLS policy `FOR ALL` | Difícil revisar | 4 policies separadas |
| `SELECT *` em query React | Trafega muito dado | listar colunas |
| Migration mexer em dado existente | Quebra regra global | sempre aditivo |
