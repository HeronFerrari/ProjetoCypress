# Cenários de Teste - Automação Front-end com Cypress
## Site: KaBuM! (e-commerce)

---

## 1. CT-001: Login com Credenciais Válidas

### Objetivo
Validar se um usuário consegue realizar login no site KaBuM com credenciais válidas.

### Pré-condições
- Navegador Chrome/Firefox iniciado
- Cypress configurado e rodando
- Usuário com conta ativa em `www.kabum.com.br`

### Passos
1. Acessar a página inicial de `https://www.kabum.com.br`
2. Localizar e clicar no botão/link de "Login" ou "Minha Conta"
3. Preencher campo de email com credencial válida
4. Preencher campo de senha com credencial válida
5. Clicar em "Entrar" ou botão de confirmação
6. Aguardar redirecionamento para página de conta do usuário

### Resultado Esperado
- Login realizado com sucesso
- Usuário redirecionado para página de conta ou dashboard
- Nome do usuário visível no header/menu
- Sem mensagens de erro de autenticação

### Status Atual
🔄 **SKIPPED** — Requer seletores específicos do formulário de login da KaBuM (não implementado ainda)

### Observações
- Necessário atualizar seletores conforme mudanças no site
- Pode exigir tratamento de 2FA ou OTP se habilitado na conta

---

## 2. CT-002: Pesquisa de Produto

### Objetivo
Validar se o sistema de busca funciona e retorna resultados relevantes para um termo de pesquisa.

### Pré-condições
- Navegador iniciado
- Cypress configurado
- Acesso à página inicial de `www.kabum.com.br`

### Passos
1. Acessar `https://www.kabum.com.br`
2. Localizar campo de busca (input com name="query")
3. Digitar termo de busca (ex: "Monitor")
4. Pressionar ENTER ou clicar em botão de busca
5. Aguardar carregamento da página de resultados
6. Validar se resultados aparecem na tela

### Resultado Esperado
- Página de resultados carregada corretamente
- URL contém o termo buscado (ex: `?q=Monitor`)
- Título da página inclui o termo buscado
- Mínimo de 5 produtos exibidos em cards (article.productCard)
- Sem erros 404 ou timeouts

### Status Atual
🔄 **SKIPPED** — Implementado, mas desativado para focar em CT-003

### Observações
- Seletor usado: `input[name="query"]`
- Validação de contagem: `article.productCard` deve ter `length > 5`
- Alternativa: usar `cy.contains()` para buscar por texto dinâmico

---

## 3. CT-003: Adicionar Produto ao Carrinho e Validar Subtotal ⭐

### Objetivo
**Principal teste de e-commerce**: Validar fluxo completo de adicionar um produto ao carrinho e verificar se o subtotal está correto.

### Pré-condições
- Cypress rodando
- Acesso à página do produto (Notebook Lenovo LoQ)
- Produto disponível em estoque

### Passos
1. **Navegar para página do produto:**
   - URL: `https://www.kabum.com.br/produto/879311/notebook-lenovo-loq-e-15iax9e-intel-core-i5-12450hx-16gb-512gb-ssd-rtx-3050-linux-15-6-83mes00000-luna-grey`

2. **Fechar banners/cookies:**
   - Detectar e clicar em botão "ACEITAR" ou similares
   - Múltiplos seletores tentados: `#onetrust-accept-btn-handler`, `.optanon-allow-all`, etc.

3. **Validar disponibilidade do produto:**
   - Verificar se página contém palavras como "esgotado", "indisponível", "sem estoque"
   - Falhar o teste com mensagem clara se produto fora de estoque

4. **Capturar preço do produto:**
   - Seletor: `h4.text-4xl.text-secondary-500.font-bold`
   - Extrair valor numérico (ex: "R$ 4.487,06")
   - Converter para número float para comparação

5. **Clicar em "Adicionar ao Carrinho":**
   - Seletor: `button[aria-label="Adicionar ao carrinho"]`
   - **Interceptar requisição POST** que contém `/carrinho|/cart|/adicionar`
   - Aguardar resposta da requisição (timeout: 8s)

6. **Navegar para página do carrinho:**
   - Tentar clicar em link do carrinho no header
   - Fallback: visitar diretamente `https://www.kabum.com.br/carrinho`
   - Validar URL contém `/carrinho`

7. **Validar subtotal:**
   - Buscar valor "R$" na página usando regex
   - Tentar múltiplos seletores: `#valorDosProdutos`, `section[aria-label="Resumo"]`, `section#total`
   - Usar último valor "R$" encontrado como fallback
   - **Comparar subtotal com preço capturado** — devem ser iguais

### Resultado Esperado
- ✅ Produto adicionado ao carrinho com sucesso
- ✅ Página do carrinho carregada sem erros
- ✅ Subtotal exibido corretamente
- ✅ Valor do subtotal = preço do produto (sem descontos aplicados)
- ✅ Sem screenshots de erro

### Status Atual
✅ **PASSING** — 100% estável (5/5 execuções headless)

### Melhorias Implementadas
1. **Intercept de requisição:** Aguarda chamada HTTP POST antes de validar carrinho
2. **Cookie handling robusto:** Tenta múltiplos seletores de cookie/banner
3. **Out-of-stock detection:** Detecta e falha com mensagem clara se produto indisponível
4. **Fallback resiliente:** Múltiplas estratégias para encontrar preço e subtotal
5. **Captura de payload:** Loga request/response para debug

### Bugs Encontrados e Resolvidos
| Problema | Solução |
|----------|---------|
| Carrinho aparecia vazio | Implementar intercept e aguardar confirmação HTTP |
| Timeout procurando por elementos | Adicionar fallback para seletores alternativos |
| Banner de cookies bloqueando conteúdo | Tentar múltiplos seletores de fechamento |
| Seletores rígidos falhando | Usar aria-label e data attributes + regex fallback |

### Tempo de Execução
- Headless: ~22-23 segundos
- Headed (Chrome): ~19-21 segundos

---

## 4. CT-004: Navegação por Categoria e Aplicação de Filtro

### Objetivo
Validar se filtros funcionam corretamente ao navegar pela categoria de Hardware.

### Pré-condições
- Cypress rodando
- Acesso ao site `www.kabum.com.br`

### Passos
1. Navegar para categoria Hardware: `https://www.kabum.com.br/hardware`
2. Validar carregamento da página (URL deve conter `/hardware`)
3. Localizar filtro de marca (coluna esquerda)
4. Clicar no checkbox/label para marca "AMD"
5. Aguardar atualização da página
6. Validar se URL foi alterada para incluir o filtro

### Resultado Esperado
- Página de categoria carregada
- URL contém `/hardware`
- Após aplicar filtro AMD, URL deve incluir `id_marca=` ou similar
- Produtos filtrados exibidos (count > 0)
- Sem erros 404 ou timeouts

### Status Atual
🔄 **SKIPPED** — Requer validação de seletores específicos do filtro

### Observações
- Seletor esperado: `label:contains("AMD")`
- KaBuM pode usar URL params diferentes (id_marca, marca, filter, etc)
- Pode exigir análise de query string para validação

---

## 5. CT-005: Aumentar Quantidade no Carrinho e Validar Subtotal

### Objetivo
Validar se ao aumentar a quantidade de um item no carrinho, o subtotal é recalculado corretamente.

### Pré-condições
- Produto já adicionado ao carrinho (via CT-003)
- Cypress rodando
- Página do carrinho carregada

### Passos
1. Acessar página do produto novamente (URL do Notebook Lenovo)
2. Capturar preço unitário do produto
3. Adicionar ao carrinho
4. Navegar para página do carrinho
5. Localizar item adicionado
6. Clicar em botão "+" ou incrementar quantidade
7. Validar que quantidade mudou para 2
8. Validar que subtotal = preço × 2

### Resultado Esperado
- Quantidade atualizada para 2 na tela
- Subtotal recalculado corretamente
- Valor = preço_unitário × 2
- Sem erros de cálculo

### Status Atual
🔄 **SKIPPED** — Requer seletores específicos do carrinho (botão +, campo quantidade)

### Observações
- Seletor esperado botão +: `button[aria-label="Aumentar quantidade"]`
- Seletor campo quantidade: `input[aria-label="quantidade do produto"]`
- Comparação numérica com tolerância (usar `.to.be.closeTo()` para floats)

---

## Resumo de Cobertura de Testes

| CT | Funcionalidade | Status | Prioridade |
|----|---|---|---|
| CT-001 | Login | 🔄 SKIPPED | Média |
| CT-002 | Busca de Produto | 🔄 SKIPPED | Média |
| CT-003 | Add to Cart + Validar Subtotal | ✅ PASSING | **ALTA** |
| CT-004 | Filtrar por Categoria | 🔄 SKIPPED | Média |
| CT-005 | Aumentar Qtd no Carrinho | 🔄 SKIPPED | Média |

---

## Tecnologias e Ferramentas Utilizadas

- **Cypress:** v15.7.0
- **Node.js:** v22.15.0
- **Navegadores testados:** Chrome 142, Electron 138 (headless)
- **Sistema Operacional:** Windows 10/11
- **Linguagem:** JavaScript (ES6+)

---

## Estratégias de Teste Implementadas

### 1. **Network Interception**
```javascript
cy.intercept({ method: 'POST', url: /.*(carrinho|cart|adicionar).*/i }).as('addCart');
cy.wait('@addCart', { timeout: 8000 });
```
- Detecta quando item é efetivamente adicionado ao carrinho
- Evita falsos positivos quando página ainda não atualizou

### 2. **Resilient Selectors**
```javascript
// Tenta múltiplos seletores em fallback
cy.get('#valorDosProdutos, section[aria-label="Resumo"], section#total, .sc-total-price')
  .first()
  .should('be.visible');
```
- Adapta-se a mudanças de layout/classes
- Usa aria-label (acessibilidade) em preferência a classes genéricas

### 3. **Cookie/Banner Handling**
```javascript
const cookieSelectors = [
  'button:contains("ACEITAR")',
  '#onetrust-accept-btn-handler',
  '.optanon-allow-all'
];
// Tenta cada um sem falhar o teste
```
- Trata overlays que bloqueiam interação
- Múltiplas tentativas sem quebrar fluxo

### 4. **Out-of-Stock Detection**
```javascript
if (/esgotad|indispon[ií]vel|sem estoque/i.test(pageText)) {
  throw new Error('Produto está indisponível');
}
```
- Falha rapidamente e com mensagem clara
- Economiza tempo de teste evitando fluxo incompleto

### 5. **Regex-based Extraction**
```javascript
const match = pageText.match(/R\$\s*[0-9\.\,]+/);
const value = parseFloat(match[0].replace(/[^0-9,]/g, '').replace(',', '.'));
```
- Extrai valores monetários independente de seletor exato
- Converte formato brasileiro (vírgula decimal) para número

---

## Desafios Enfrentados e Soluções

### 1. **Carrinho Vazio Após Adicionar Item**
- **Causa:** Teste navegava para carrinho antes da requisição HTTP ser processada
- **Solução:** Implementar `cy.intercept()` e aguardar `@addCart`

### 2. **Seletores Frágeis (Classes Geradas Dinamicamente)**
- **Causa:** Site usa Tailwind CSS com classes que mudam frequentemente
- **Solução:** Preferir `aria-label`, `data-*` attributes; fallback para regex + busca textual

### 3. **Banner de Cookies Bloqueando Interação**
- **Causa:** Banner overlay impede clique em elementos
- **Solução:** Lista de múltiplos seletores de cookie para tentar sequencialmente

### 4. **Timeout ao Procurar Elementos**
- **Causa:** Page carrega dinamicamente; elemento não está pronto imediatamente
- **Solução:** Aumentar timeout, usar `cy.contains()` com regex, implementar fallbacks

### 5. **Produto Indisponível Causando Falha Silenciosa**
- **Causa:** Teste tentava adicionar item esgotado sem avisar claramente
- **Solução:** Detectar regex "esgotado|indisponível" no body text; falhar com mensagem explícita

---

## Melhorias Futuras Propostas

1. **Testes de Login (CT-001)**
   - Implementar credenciais de teste seguras (env vars)
   - Validar tokens/sessão armazenados

2. **Teste de Múltiplos Produtos**
   - Parametrizar URL do produto para testar diferentes SKUs
   - Validar preços variáveis (promoções, descontos)

3. **Teste de Checkout Completo**
   - Adicionar novo CT-006: Finalizar compra
   - Validar processo de pagamento (sem efetuar pagamento real)

4. **Visual Testing**
   - Integrar Applitools ou Percy para captura de screenshots
   - Detectar mudanças visuais não intencionais

5. **Performance Testing**
   - Medir tempo de carregamento das páginas
   - Validar limites de timeout aceitáveis

6. **Testes em Múltiplos Navegadores**
   - Atual: Chrome, Electron
   - Adicionar: Firefox, Safari (em CI)

7. **Testes Responsivos**
   - Validar em viewport mobile, tablet, desktop
   - Testar touch interactions vs mouse clicks

8. **Error Handling Robusto**
   - Capturar screenshots em cada falha
   - Gerar relatórios HTML detalhados
   - Integrar com Slack/email para notificações

---

## Como Executar os Testes

### Modo Interativo (Headed)
```bash
npx cypress open
# Selecionar carrinho.cy.js e clicar em CT-003
```

### Modo Headless (Automatizado)
```bash
npx cypress run --spec "cypress/e2e/carrinho.cy.js" --headless
```

### Rodar 5 Iterações (Validar Estabilidade)
```powershell
powershell -ExecutionPolicy Bypass -File "run_tests.ps1"
```

### Gerar Relatório HTML
```bash
npx cypress run --spec "cypress/e2e/carrinho.cy.js" --reporter html
# Abrir cypress/reports/html/index.html
```

---

## Referências

- **Cypress Docs:** https://docs.cypress.io
- **KaBuM Site:** https://www.kabum.com.br
- **GitHub Repo:** [Link do repositório]

---

**Data de Criação:** 09/12/2025  
**Versão:** 1.0  
**Status:** Documento em produção — CT-003 validado e estável
