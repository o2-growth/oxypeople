
# Rebranding Visual: Oxy People - Identidade O2 Inc

## Analise da Identidade Visual O2 Inc

Baseado na pagina de vendas Oxy Hacker, identifiquei os seguintes elementos de marca:

**Paleta de Cores Principal:**
- **Verde Neon/Lime**: #22C55E (cor de destaque principal, botoes CTA)
- **Fundo Escuro**: #0A0A0A / #111111 (backgrounds profundos)
- **Tons de Verde**: Gradientes do verde escuro ao lime
- **Texto Claro**: Branco e tons de cinza claro sobre fundos escuros

**Estetica Visual:**
- Dark mode como padrao (tema profissional/tech)
- Efeitos de glow verde nos elementos de destaque
- Visual moderno "hacker/tech" com codigo binario como elemento decorativo
- Tipografia bold e impactante
- Botoes com cor solida verde vibrante

---

## Alteracoes Planejadas

### 1. Atualizar Variaveis CSS (src/index.css)

**Nova Paleta Light Mode:**
| Variavel | Valor Atual | Novo Valor (HSL) | Cor |
|----------|-------------|------------------|-----|
| --primary | 220 70% 50% (azul) | 142 71% 45% (verde O2) | Verde |
| --accent | 174 72% 40% (teal) | 142 76% 45% (lime) | Verde Lime |
| --sidebar-background | 222 47% 11% | 0 0% 7% | Preto profundo |
| --sidebar-primary | 174 72% 50% | 142 71% 50% | Verde |

**Nova Paleta Dark Mode:**
| Variavel | Valor Atual | Novo Valor (HSL) | Cor |
|----------|-------------|------------------|-----|
| --background | 222 47% 6% | 0 0% 5% | Preto profundo |
| --primary | 220 70% 55% | 142 71% 50% | Verde |
| --accent | 174 72% 45% | 142 76% 50% | Verde Lime |

**Gradientes Atualizados:**
```css
--gradient-primary: linear-gradient(135deg, hsl(142 71% 40%) 0%, hsl(142 76% 50%) 100%);
--gradient-accent: linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(155 75% 50%) 100%);
--gradient-hero: linear-gradient(135deg, hsl(0 0% 5%) 0%, hsl(142 30% 15%) 50%, hsl(142 40% 20%) 100%);
```

**Sombras com Glow Verde:**
```css
--shadow-glow: 0 0 20px hsla(142, 71%, 45%, 0.3);
--shadow-accent-glow: 0 0 20px hsla(142, 76%, 50%, 0.4);
```

### 2. Atualizar Logo e Branding (AppSidebar.tsx)

Substituir o icone generico de Sparkles por um icone customizado que represente a marca O2:
- Manter o container com gradiente verde
- Atualizar texto "Oxy People" com estilo adequado
- Aplicar glow verde no container do icone

### 3. Atualizar Pagina de Login (Auth.tsx)

- Alterar gradiente do painel esquerdo para tons de verde/preto da O2
- Adicionar elementos decorativos inspirados no visual "tech" (grid sutil)
- Atualizar texto de "People Hub" para "Oxy People" (ja feito parcialmente)
- Aplicar cores verdes nos elementos de destaque
- Botao CTA com verde solido

### 4. Adicionar Logo O2 (opcional)

Se fornecida uma imagem do logo O2:
- Atualizar favicon
- Adicionar logo na sidebar
- Adicionar logo na pagina de login

---

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `src/index.css` | Atualizar todas as variaveis de cor, gradientes e sombras |
| `tailwind.config.ts` | Nenhuma alteracao necessaria (usa variaveis CSS) |
| `src/components/layout/AppSidebar.tsx` | Atualizar icone/logo e estilos |
| `src/pages/Auth.tsx` | Atualizar gradientes e texto do branding |
| `index.html` | Atualizar favicon quando disponivel |

---

## Preview Visual Esperado

**Sidebar:**
- Fundo preto profundo (#0A0A0A)
- Itens ativos com destaque verde
- Glow verde no icone do logo

**Cards e Botoes:**
- Botoes primarios em verde solido
- Hover com efeito de glow verde
- Cards mantendo fundo claro no light mode

**Pagina de Login:**
- Painel esquerdo com gradiente escuro com tons de verde
- Efeito de grid/codigo decorativo sutil
- Botao CTA verde vibrante

---

## Proximos Passos Apos Aprovacao

1. Atualizar variaveis CSS com a nova paleta
2. Modificar componentes visuais (sidebar, login)
3. Testar em ambos os modos (light/dark)
4. Ajustar detalhes conforme necessario

**Observacao:** Se voce tiver o arquivo da logo oficial da O2 Inc / Oxy People, pode envia-lo para que eu adicione ao projeto (favicon e sidebar).
