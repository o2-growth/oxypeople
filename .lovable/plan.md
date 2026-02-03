

## Plano: Alterar Cor do Painel de Login para Teal/Verde-água

### Visão Geral
Alterar o gradiente do painel esquerdo da página de login de azul escuro para um gradiente vibrante em tons de teal/verde-água, mantendo a identidade visual moderna do sistema.

### Mudança a ser Realizada

**Arquivo:** `src/index.css`

Alterar a variável CSS `--gradient-hero` de:
```css
--gradient-hero: linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(220 50% 20%) 50%, hsl(200 60% 25%) 100%);
```

Para:
```css
--gradient-hero: linear-gradient(135deg, hsl(174 72% 25%) 0%, hsl(168 65% 35%) 50%, hsl(160 70% 40%) 100%);
```

### Cores do Novo Gradiente
- **Início:** Teal escuro profundo (174° 72% 25%)
- **Meio:** Teal médio (168° 65% 35%)
- **Fim:** Verde-água vibrante (160° 70% 40%)

### Resultado Visual
O painel esquerdo da tela de login ficará com um gradiente que vai do teal escuro ao verde-água, criando uma aparência mais vibrante e alinhada com a cor de destaque (accent) já usada no sistema.

### Impacto
- Apenas o painel esquerdo da página de login será afetado
- Mantém contraste adequado com o texto branco existente
- Alinha com o design system que já usa teal como cor de accent

