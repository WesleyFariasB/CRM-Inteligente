describe('autenticação', () => {
  it('exibe o formulário de login', () => {
    cy.visit('/login');
    cy.contains('h1', /boas-vindas de volta/i).should('be.visible');
    cy.contains('button', /entrar na conta/i).should('be.visible');
  });

  it('protege a área autenticada', () => {
    cy.visit('/app/dashboard');
    cy.location('pathname').should('eq', '/login');
  });
});
