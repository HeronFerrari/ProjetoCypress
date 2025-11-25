// <reference types="cypress" />

describe('Fluxo Completo de Comércio Eletrônico', () => {

    // VARIÁVEL DE AMBIENTE: Substitua por um URL base real
    const URL_BASE = 'https://www.kabum.com.br/'; // Altere para o URL do site escolhido

    before(() => {
        // Assume que o site requer autenticação, mas vamos focar no fluxo
        cy.visit(URL_BASE);
        cy.log('Navegou para a página inicial.');
    });

    // =================================================================
    // CT-001: Login Válido
    // =================================================================
    it('CT-001: Deve realizar o login com credenciais válidas', () => {
        // OBSERVAÇÃO: Mudar os seletores e a URL para o seu site
        
        // Clica no link de login
        cy.get('[data-cy="link-login"]').click();
        cy.url().should('include', '/login');

        // Preenche o formulário
        cy.get('[data-cy="input-email"]').type('usuario.valido@teste.com');
        cy.get('[data-cy="input-senha"]').type('SenhaSegura123');
        
        // Clica no botão e valida o redirecionamento
        cy.get('[data-cy="botao-enviar"]').click();

        // Validação (deve redirecionar para a página inicial ou painel)
        cy.url().should('not.include', '/login');
        cy.get('[data-cy="saudacao-usuario"]').should('contain', 'Olá, Usuário');
        cy.log('Login realizado com sucesso.');
    });

    // =================================================================
    // CT-003: Adicionar ao Carrinho e Validar Preço
    // =================================================================
    it('CT-003: Deve adicionar um item ao carrinho e validar o subtotal', () => {
        // Acessa uma página de produto (substitua o seletor/URL)
        cy.visit(URL_BASE + 'produtos/livro-cypress'); 

        // 1. Valida o preço antes de adicionar
        let precoProduto = 0;
        cy.get('[data-cy="preco-unitario"]')
          .invoke('text') // Obtém o texto do elemento (ex: R$ 50,00)
          .then(precoTexto => {
            // Limpa o texto para obter apenas o número e armazena
            precoProduto = parseFloat(precoTexto.replace('R$', '').replace(',', '.').trim());
            cy.log(`Preço Unitário Identificado: ${precoProduto}`);
          });

        // 2. Adiciona ao carrinho
        cy.get('[data-cy="botao-add-carrinho"]').click();
        cy.log('Produto adicionado ao carrinho.');

        // 3. Navega para a página do carrinho
        cy.get('[data-cy="icone-carrinho"]').click();
        cy.url().should('include', '/carrinho');

        // 4. Valida o subtotal no carrinho
        cy.get('[data-cy="subtotal-carrinho"]')
          .invoke('text')
          .then(subtotalTexto => {
            const subtotal = parseFloat(subtotalTexto.replace('R$', '').replace(',', '.').trim());
            
            // Verificação crítica: O subtotal deve ser igual ao preço unitário (para 1 item)
            expect(subtotal).to.equal(precoProduto);
            cy.log(`Validação de subtotal OK. Esperado: ${precoProduto}, Encontrado: ${subtotal}`);
          });
          
        // 5. Verificação visual: Deve haver um item no carrinho
        cy.get('[data-cy="lista-itens-carrinho"]').children().should('have.length', 1);
    });

});