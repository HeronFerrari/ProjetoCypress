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
    it.skip('CT-002: Deve pesquisar por um produto e validar resultados', () => { 
        const termoBusca = 'Monitor';

        // 1. Acessa o campo de busca e garante que ele está visível
        const campoBusca = cy.get('input[name="query"]').should('be.visible');

        // 2. Tenta pressionar ENTER, que é mais robusto que o clique no botão
        campoBusca.type(`${termoBusca}{enter}`); 
        
        // 3. Validação de Conteúdo 1: O título da página deve conter a palavra 'Monitor'
        cy.wait(3000); 
        cy.title().should('include', termoBusca);

        // Validação de Conteúdo 2: A contagem de resultados é a verificação crítica
        cy.get('article.productCard').should('have.length.greaterThan', 5);
        cy.log(`Pesquisa por "${termoBusca}" bem-sucedida e resultados validados.`);
    });

    // =================================================================
    // CT-003: Adicionar ao Carrinho e Validar Preço (Foco no Processador Ryzen)
    // =================================================================
    it.only('CT-003: Deve adicionar um item ao carrinho e validar o subtotal', () => { 
        // Navega diretamente para a página do produto (A URL BASE será visitada no beforeEach)
        cy.visit(URL_BASE + 'produto/520038/processador-amd-ryzen-7-5700x3d-3-0ghz-4-1ghz-max-turbo-cache-16-threads-8-nucleos-am4-sem-cooler-100-100001503mpk'); 

        // CRÍTICO: TRATAMENTO DO POP-UP DE PREÇO AQUI (DEPOIS DA PÁGINA DO PRODUTO CARREGAR)
        // Tentativa 1: Clicar no botão 'Mais Tarde' do modal de preço
        cy.get('body', { timeout: 7000 }).then(($body) => {
            const btnMaisTarde = $body.find('button:contains("Mais Tarde")'); 

            if (btnMaisTarde.length) {
                cy.wrap(btnMaisTarde).click({ force: true });
                cy.log('Modal de comparação de preços (Mais Tarde) descartado/clicado.');
                cy.wait(1000); // Espera o modal sumir
            } else {
                cy.log('Modal de comparação de preços não apareceu, prosseguindo.');
            }
        });


        // 2. Valida o preço antes de adicionar 
        let precoProduto = 0;
        // SELETOR REAL DO PREÇO DE VENDA 
        cy.get('h4.text-4xl.text-secondary', { timeout: 10000 }) 
          .invoke('text') 
          .then(precoTexto => {
            // Limpa o texto (R$, pontos e vírgulas)
            precoProduto = parseFloat(precoTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
            cy.log(`Preço Unitário Identificado: ${precoProduto}`);
          });

        // 3. Adiciona ao carrinho (USANDO O SELETOR REAL DO BOTÃO)
        cy.get('button[aria-label="Adicionar ao carrinho"]').click(); 
        cy.log('Produto adicionado ao carrinho.');

        // 4. Navega para a página do carrinho (Seletor precisa ser real!)
        // Tenta buscar o seletor do link/ícone do carrinho
        cy.get('a[href*="/carrinho"], [data-cy="icone-carrinho"]', { timeout: 5000 }).click(); 
        cy.url().should('include', '/carrinho');

        // 5. Valida o subtotal no carrinho (Seletor precisa ser real!)
        // Tenta buscar o subtotal ou o total de itens no carrinho
        cy.get('.sc-total-price, [data-cy="subtotal-carrinho"], .sc-total-carrinho') 
          .invoke('text')
          .then(subtotalTexto => {
            const subtotal = parseFloat(subtotalTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
            
            // Verificação crítica
            expect(subtotal).to.equal(precoProduto);
            cy.log(`Validação de subtotal OK. Esperado: ${precoProduto}, Encontrado: ${subtotal}`);
          });
          
        // 6. Verificação visual
        cy.get('article.productCard').should('have.length.greaterThan', 0);
    });

});