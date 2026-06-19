import { test, expect } from '@playwright/test';

test.describe('Modais por Aba no Cadastro de Militares', () => {
  // Gera um nome único para o teste
  const nomeRandom = `Sgt Aba Teste ${Date.now()}`;
  const ident = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digitos

  test('Deve exibir modais específicos para cada aba e permitir edição', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Acessar a tela e logar
    await page.goto('/cadastro');
    const userEmail = `teste${Date.now()}@test.com`;
    await page.fill('input[id="inome"]', 'Tester User');
    await page.fill('input[id="iemail"]', userEmail);
    await page.waitForSelector('select#ipg option:nth-child(2)', { state: 'attached', timeout: 10000 });
    await page.locator('select#ipg').selectOption({ index: 1 });
    await page.waitForSelector('select#icompanhia option:nth-child(2)', { state: 'attached', timeout: 10000 });
    await page.locator('select#icompanhia').selectOption({ index: 1 });
    await page.fill('input[id="isenha"]', '123456');
    await page.fill('input[id="isenha2"]', '123456');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/login', { timeout: 4000 });
      await page.fill('input[id="email"]', userEmail);
      await page.fill('input[id="isenha"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/');
    } catch (e) {
      // Já pode estar logado e redirecionado
    }

    // 2. Ir para o Cadastro Militares e adicionar um militar temporário
    await page.goto('/sgte/cadastro-militares');

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.click('text="Novo Militar"');
    await page.waitForURL('**/sgte/cadastro-militares/novo');

    await page.fill('input[name="nomeGuerra"]', nomeRandom);
    await page.fill('input[name="nomeCompleto"]', `${nomeRandom} Completo`);
    await page.type('input[name="idtMil"]', ident, { delay: 10 });
    await page.type('input[name="cpf"]', '12345678901', { delay: 10 });
    await page.fill('input[name="cidade"]', 'São Paulo');
    await page.fill('input[name="dataPraca"]', '2020-01-01');
    await page.fill('input[name="dataNascimento"]', '1990-01-01');
    
    await page.selectOption('select[name="postoGraduacao"]', { index: 1 });
    await page.selectOption('select[name="situacao"]', { index: 1 });
    await page.selectOption('select[name="sexo"]', { index: 1 });
    await page.selectOption('select[name="periodoObrigatorio"]', { index: 1 });
    await page.selectOption('select[name="secaoCompanhia"]', { index: 1 });
    await page.selectOption('select[name="pelotao"]', { index: 1 });
    await page.selectOption('select[name="tipoSanguineo"]', { index: 1 });
    await page.selectOption('select[name="fatorRh"]', { index: 1 });
    await page.selectOption('select[name="cutis"]', { index: 1 });
    await page.selectOption('select[name="olhos"]', { index: 1 });
    await page.selectOption('select[name="cabelos"]', { index: 1 });
    await page.selectOption('select[name="escolaridade"]', { index: 1 });
    await page.selectOption('select[name="estadoCivil"]', { index: 1 });
    await page.selectOption('select[name="uf"]', { index: 1 });

    await page.click('button[type="submit"]');

    await page.waitForURL('**/sgte/cadastro-militares', { timeout: 15000 });

    await page.fill('input[placeholder="Digite o nome de guerra ou nome completo..."]', nomeRandom);
    await page.waitForTimeout(1000);

    // 3. Teste Aba Dados Pessoais
    await page.click('text="Dados Pessoais"');
    await page.waitForTimeout(500);

    const rowCard = page.locator(`text=${nomeRandom}`).first();
    await rowCard.click();

    // Modal de Resumo deve aparecer com apenas Dados Pessoais visíveis
    await expect(page.locator('text="Resumo do Militar"').first()).toBeVisible();
    await expect(page.locator('h4:has-text("Dados Pessoais")')).toBeVisible();
    await expect(page.locator('h4:has-text("Situação Funcional")')).toBeHidden();

    await page.click('button:has-text("Atualizar Campos")');
    // Deve haver inputs para IDT Mil, CPF e Nº EBCA
    await expect(page.locator('input[value="' + ident + '"]')).toBeVisible();

    await page.click('button:has-text("Cancelar")');
    await page.click('button:has-text("Fechar")');

    // 4. Teste Aba Situação Funcional
    await page.click('text="Situação Funcional"');
    await page.waitForTimeout(500);

    const rowSituacao = page.locator(`text=${nomeRandom}`).first();
    await rowSituacao.click();

    // Modal de Resumo deve aparecer com apenas Situação Funcional visível
    await expect(page.locator('h4:has-text("Situação Funcional")')).toBeVisible();
    await expect(page.locator('h4:has-text("Dados Pessoais")')).toBeHidden();

    await page.click('button:has-text("Atualizar Campos")');
    
    // Verifica campo de Busca de Substituto
    await expect(page.locator('input[placeholder="Buscar militar substituto..."]')).toBeVisible();
    await page.fill('input[placeholder="Buscar militar substituto..."]', 'Teste');
    
    await page.click('button:has-text("Cancelar")');
    await page.click('button:has-text("Fechar")');

    // 5. Teste Aba Documentos
    await page.click('text="Documentos"');
    await page.waitForTimeout(500);

    const rowDocs = page.locator(`text=${nomeRandom}`).first();
    await rowDocs.click();

    await expect(page.locator('h4:has-text("Documentos")')).toBeVisible();
    await expect(page.locator('h4:has-text("Dados Pessoais")')).toBeHidden();
    
    await page.click('button:has-text("Fechar")');
  });
});
