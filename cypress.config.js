const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // Adicionando um timeout generoso para o carregamento de páginas pesadas (KaBuM!)
  pageLoadTimeout: 120000, // 120 segundos (2 minutos) para carregar a página

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});