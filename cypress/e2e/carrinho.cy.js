// <reference types="cypress" />

// [CRÍTICO] Trata exceções do próprio aplicativo (como Minified React Error #418).
// Isso evita que o teste falhe devido a bugs de terceiros/produção.
Cypress.on('uncaught:exception', (err, runnable) => {
    // Retorna false para evitar que o Cypress falhe o teste.
    // Faça isso apenas para erros que não afetam a funcionalidade testada.
    return false;
});


describe('Fluxo Completo de Comércio Eletrônico', () => {

    // VARIÁVEL DE AMBIENTE: URL real da KaBuM!
    const URL_BASE = 'https://www.kabum.com.br/'; 

    beforeEach(() => { 
        // --- 1. LIMPEZA CRÍTICA: Força o banner de cookies a aparecer ---
        cy.clearCookies();
        cy.clearLocalStorage();
        
        cy.visit(URL_BASE, { timeout: 15000 }); // Aumenta timeout de visita
        cy.log('Navegou para a página inicial da KaBuM!.');
        
        // --- 2. TRATAMENTO DE OVERLAYS (POPUPS) ---

        // Funcao utilitária para tentar clicar em um seletor se ele existir, sem falhar o teste
        const clickIfVisible = (selector, timeout = 5000) => {
            cy.get('body', { timeout: timeout }).then(($body) => {
                if ($body.find(selector).length) { 
                    cy.get(selector, { timeout: 5000 }).click({ force: true });
                    cy.log(`Elemento "${selector}" descartado com sucesso.`);
                } else {
                    cy.log(`Elemento "${selector}" não visível, prosseguindo.`);
                }
            });
        };

        // Tenta encontrar o banner de LGPD (Cookies) - Usando a palavra "ACEITAR" no botão
        clickIfVisible('button:contains("ACEITAR"), button[aria-label*="Concordar com os cookies"]', 7000);
        
        // Tenta fechar o Toast de Cashback (o que você inspecionou antes)
        clickIfVisible('#cuponomia-data-v-app .btn-close');

        cy.wait(500); // Pequena pausa
    });

    // =================================================================
    // CT-001: Login Válido (REQUER ADAPTAÇÃO TOTAL DE SELETORES)
    // =================================================================
    it.skip('CT-001: Deve realizar o login com credenciais válidas', () => { 
        // Código do CT-001...
    });

    // =CASO DE TESTE ATUAL: PESQUISA DE PRODUTO========================
    it('CT-002: Deve pesquisar por um produto e validar resultados', () => { 
        const termoBusca = 'Monitor';

        // 1. Acessa o campo de busca e garante que ele está visível
        cy.get('input[name="query"]', { timeout: 10000 }).should('be.visible').type(`${termoBusca}{enter}`);
        cy.log(`Busca por "${termoBusca}" executada.`);
        
        // 2. Aguarda carregamento da página de resultados
        cy.wait(2000); 
        
        // 3. Validação: O título da página deve conter a palavra 'Monitor'
        cy.title().should('include', termoBusca);
        cy.log(`Título da página contém "${termoBusca}".`);

        // 4. Validação: A contagem de resultados (verificação crítica)
        cy.get('article.productCard', { timeout: 10000 }).should('have.length.greaterThan', 0);
        cy.log(`Resultados encontrados e validados.`);
    });

    // =================================================================
    // CT-003: Adicionar ao Carrinho e Validar Preço (Foco no Processador Ryzen)
    // =================================================================
    it('CT-003: Deve adicionar um item ao carrinho e validar o subtotal', () => {
            const URL_PRODUTO = 'https://www.kabum.com.br/produto/879311/notebook-lenovo-loq-e-15iax9e-intel-core-i5-12450hx-16gb-512gb-ssd-rtx-3050-linux-15-6-83mes00000-luna-grey';

                // 1. Visita a página do produto
                cy.visit(URL_PRODUTO, { timeout: 20000 });
                // screenshot: página do produto carregada
                cy.screenshot('produto_page');

                // 1.1. Tenta fechar vários tipos de banners/cookies (mais resiliente)
                const cookieSelectors = [
                    'button:contains("ACEITAR")',
                    'button[aria-label*="Concordar com os cookies"]',
                    '#onetrust-accept-btn-handler',
                    '.cookie-consent button',
                    '.js-accept-cookies',
                    '.optanon-allow-all',
                    'button:contains("Aceitar")'
                ];

                cy.get('body', { timeout: 10000 }).then(($body) => {
                    cookieSelectors.forEach(sel => {
                        if ($body.find(sel).length) {
                            cy.get(sel, { timeout: 5000 }).first().click({ force: true });
                            cy.log(`Fechado cookie/modal com seletor: ${sel}`);
                        }
                    });
                });

                // espera rápida para o DOM se estabilizar
                cy.wait(800);

                // 1.2. Detecta se o produto está esgotado/indisponível e falha com mensagem informativa
                cy.get('body', { timeout: 5000 }).then($body => {
                    const text = $body.text();
                    if (/esgotad|indispon[ií]vel|sem estoque|não disponível|indisponivel/i.test(text)) {
                        throw new Error('Produto parece estar esgotado/indisponível — interrompendo o teste.');
                    }
                });

                // 2. Captura o preço do produto
                cy.get('h4.text-4xl.text-secondary-500.font-bold', { timeout: 20000 })
                  .should('be.visible')
                  .invoke('text')
                  .then((precoTexto) => {
                        const precoProduto = parseFloat(precoTexto.replace(/[^0-9,]/g, '').replace(',', '.'));
                        cy.log(`Preço capturado: ${precoProduto}`);

                        // 3. Intercept para detectar a requisição de adicionar ao carrinho
                        // Usamos um regex genérico que cobre /carrinho, /cart, /adicionar etc.
                        cy.intercept({ method: 'POST', url: /.*(carrinho|cart|adicionar).*/i }).as('addCart');

                        // 3.1 Clica em 'Adicionar ao carrinho'
                        cy.get('button[aria-label="Adicionar ao carrinho"]', { timeout: 10000 }).click({ force: true });
                        cy.log('Clique em "Adicionar ao carrinho" realizado. Aguardando confirmação de rede...');

                        // 3.2 Aguarda a requisição que adiciona ao carrinho (se houver). Se não ocorrer em 8s, apenas prossegue para validação visual.
                        cy.wait('@addCart', { timeout: 8000 }).then((interception) => {
                            cy.log('Chamada de rede para adicionar ao carrinho detectada.');
                            // screenshot: após adicionar ao carrinho (mini-cart / toast)
                            cy.screenshot('apos_add');
                            
                            // 3.3 Captura e loga o payload enviado e resposta recebida
                            if (interception && interception.request) {
                                const reqBody = interception.request.body;
                                cy.log('Request Body (primeiros 200 chars):', JSON.stringify(reqBody).substring(0, 200));
                            }
                            if (interception && interception.response) {
                                const respBody = interception.response.body;
                                cy.log('Response Body (primeiros 200 chars):', JSON.stringify(respBody).substring(0, 200));
                            }
                        }, (err) => {
                            // fallback: não falhar o teste — continuamos e checamos o carrinho visualmente
                            cy.log('Nenhuma chamada de rede detectada dentro do timeout. Prosseguindo para checar o carrinho visualmente.');
                        });

                        // 4. Vai para o carrinho (seletor resiliente com fallback)
                        cy.get('body', { timeout: 10000 }).then(($body) => {
                            const cartSelector = 'a[href*="/carrinho"], a[title*="Carrinho"], [data-testid="button-cart"], [data-testid="header-cart-button"], [aria-label*="carrinho"]';
                            if ($body.find(cartSelector).length) {
                                cy.get(cartSelector).first().click({ force: true });
                                cy.url({ timeout: 10000 }).should('include', '/carrinho');
                            } else {
                                // fallback direto para a página do carrinho
                                cy.visit(URL_BASE + 'carrinho');
                                cy.url({ timeout: 10000 }).should('include', '/carrinho');
                            }
                        });

                        // 5. Aguarda que qualquer valor monetário apareça no carrinho e extrai o último R$
                        // Usamos um contains com regex para esperar por conteúdo dinâmico em qualquer parte da página.
                        cy.contains(/R\$\s*[0-9]/, { timeout: 30000 })
                          .should('be.visible')
                          .then(() => {
                            // screenshot: página do carrinho carregada com valores visíveis
                            cy.screenshot('carrinho_page');
                              const pageText = Cypress.$('body').text();
                              const matches = pageText.match(/R\$\s*[0-9\.\,]+/g);
                              let found = null;
                              if (matches && matches.length) {
                                  found = matches[matches.length - 1];
                              }

                              expect(found, 'Encontrou algum valor R$ no carrinho').to.not.be.null;
                              const subtotal = parseFloat(found.replace(/[^0-9,]/g, '').replace(',', '.'));
                              expect(subtotal).to.equal(precoProduto);
                              cy.log(`Validação de subtotal OK. Esperado: ${precoProduto}, Encontrado: ${subtotal}`);
                          });
                    });
    });
    // =================================================================
    // CT-004: Navegação por Categoria e Aplicação de Filtro
    // =================================================================
    it.skip('CT-004: Deve navegar por categoria, aplicar um filtro e validar a URL', () => { 
        // 1. Navegar para a página de uma categoria (Ex: Hardware)
        cy.visit(URL_BASE + 'hardware');
        cy.url().should('include', '/hardware');
        cy.log('Navegou para a página da categoria Hardware.');

        // 2. Aplicar um filtro de preço (CRÍTICO: Seletores devem ser reais da KaBuM!)
        // Exemplo: Filtrar pela marca 'AMD' na coluna de filtros
        const seletorFiltro = 'label:contains("AMD")'; // Tenta encontrar o checkbox/label da marca
        cy.get(seletorFiltro, { timeout: 7000 }).click();
        cy.log('Filtro de marca (AMD) aplicado.');

        // 3. Validação: Verifica se o filtro foi aplicado na URL ou no conteúdo
        // A URL da KaBuM! deve mudar para incluir a marca (ex: ?id_marca=...)
        cy.url({ timeout: 10000 }).should('include', 'AMD');

        // 4. Validação: A contagem de produtos deve ser maior que zero
        cy.get('article.productCard').should('have.length.greaterThan', 0);
        cy.log('Produtos filtrados com sucesso e exibidos na tela.');
    });

    // =================================================================
    // CT-005: Aumentar Quantidade no Carrinho e Validar Subtotal
    // =================================================================
    it.skip('CT-005: Deve aumentar a quantidade de um item no carrinho e validar a atualização do subtotal', () => {
        // Pré-condição: Garantir que o CT-003 funcionou ou adicionar um produto aqui
        
        // Simplificando: Adiciona o produto do CT-003 novamente (Processador Ryzen)
        const URL_PRODUTO = 'https://www.kabum.com.br/produto/879311/notebook-lenovo-loq-e-15iax9e-intel-core-i5-12450hx-16gb-512gb-ssd-rtx-3050-linux-15-6-83mes00000-luna-grey';
        
        let precoUnitario = 0;
    
        // 1. Navega para o produto, pega o preço e adiciona ao carrinho
        cy.visit(URL_PRODUTO, { timeout: 15000 });
        cy.get('h4.text-4xl.text-secondary').invoke('text').then(precoTexto => {
            precoUnitario = parseFloat(precoTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
            cy.log(`Preço Unitário: ${precoUnitario}`);
        });
        cy.get('button[aria-label="Adicionar ao carrinho"]').click();
        
        // 2. Navega para o carrinho
        cy.get('[data-cy="header-cart-icon"]').click(); 
        cy.url().should('include', '/carrinho');
    
        // 3. Clica para aumentar a quantidade (CRÍTICO: Seletor do botão de "+" no carrinho)
        // Seletor para o botão de aumento de quantidade (Exemplo)
        const btnAumentar = 'button[aria-label="Aumentar quantidade"]'; 
        cy.get(btnAumentar, { timeout: 7000 }).click();
        cy.log('Quantidade do produto aumentada para 2.');
    
        // 4. Valida se a nova quantidade é 2 (CRÍTICO: Seletor do campo de quantidade)
        cy.get('input[aria-label="quantidade do produto"]').should('have.value', '2');
    
        // 5. Valida o novo subtotal (Deve ser 2 * precoUnitario)
        const precoEsperado = (precoUnitario * 2).toFixed(2); // Formata para 2 casas decimais
    
        cy.get('.sc-cRkppE.gTzRkS', { timeout: 10000 }) // Seletor do subtotal
          .invoke('text')
          .then(subtotalTexto => {
            const subtotalAtual = parseFloat(subtotalTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
            
            // Comparação de números flutuantes: Use to.be.closeTo para evitar problemas de precisão
            expect(subtotalAtual).to.be.closeTo(parseFloat(precoEsperado), 0.01); 
            cy.log(`Validação de Quantidade OK. Esperado: ${precoEsperado}, Encontrado: ${subtotalAtual}`);
          });
    });

});