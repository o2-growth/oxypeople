
# Plano: Adicionar Link "Oxy VE" na Navegação

## Objetivo
Adicionar um item de menu "Oxy VE" na seção "Gestão" da sidebar, posicionado acima de "Configurações", que abre o sistema Oxy VE em uma nova aba.

## Abordagem Técnica

### 1. Modificar a Sidebar (AppSidebar.tsx)

**Adicionar ícone apropriado:**
- Importar um ícone adequado do Lucide (sugestão: `ExternalLink` ou `MonitorPlay` para indicar sistema externo)

**Atualizar o array `managementItems`:**
```text
const managementItems = [
  { title: "Empresa", url: "/company", icon: Building2 },
  { title: "RH", url: "/hr", icon: Briefcase },
  { title: "Equipes", url: "/teams", icon: UsersRound },
  { title: "Oxy VE", url: "https://oxyve.lovable.app", icon: MonitorPlay, external: true },  // NOVO
  { title: "Configurações", url: "/settings", icon: Settings },
];
```

**Modificar o componente `NavGroup`:**
- Adicionar lógica para detectar links externos (propriedade `external`)
- Para links externos: usar tag `<a>` com `target="_blank"` e `rel="noopener noreferrer"`
- Para links internos: manter o `NavLink` atual

### 2. Visual do Item Externo
- Adicionar um pequeno ícone de "external link" ao lado do texto para indicar que abrirá em nova aba
- Manter o mesmo estilo visual dos outros itens para consistência

## Benefícios da Abordagem
- Zero impacto no bundle size do Oxy People
- Projetos evoluem independentemente
- Usuário tem acesso rápido ao VE direto da navegação principal
- Indicação visual clara de que é um link externo

## Arquivos a Modificar
- `src/components/layout/AppSidebar.tsx`
