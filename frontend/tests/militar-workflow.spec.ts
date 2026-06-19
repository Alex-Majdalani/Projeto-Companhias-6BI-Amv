import { test, expect } from '@playwright/test';

test.describe('Fluxo E2E: Militar', () => {
  // Gera nome único para evitar conflito
  const nomeRandom = `Sgt Playwright ${Date.now()}`;
  const ident = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digitos
  
  test('Cadastro, Edição, PDF, Perfil e Exclusão', async ({ page }) => {
    test.setTimeout(120000); // Aumenta timeout para 120s
    // 1. Criar um usuário de teste (se necessário) ou fazer login
    await page.goto('/cadastro');
    const userEmail = `teste${Date.now()}@test.com`;
    await page.fill('input[id="inome"]', 'Tester User');
    await page.fill('input[id="iemail"]', userEmail);
    // Wait for the dropdowns to be populated
    await page.waitForSelector('select#ipg option:nth-child(2)', { state: 'attached', timeout: 10000 });
    await page.locator('select#ipg').selectOption({ index: 1 });
    await page.waitForSelector('select#icompanhia option:nth-child(2)', { state: 'attached', timeout: 10000 });
    await page.locator('select#icompanhia').selectOption({ index: 1 });
    await page.fill('input[id="isenha"]', '123456');
    await page.fill('input[id="isenha2"]', '123456');
    await page.click('button[type="submit"]');

    // Se ele navegar para /login, a gente faz o login (aumentado para 30s devido a lentidao do NocoDB)
    try {
      await page.waitForURL('**/login', { timeout: 30000 });
      await page.fill('input[id="email"]', userEmail);
      await page.fill('input[id="isenha"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/', { timeout: 30000 });
    } catch (e) {
      // Ignora erro se nao foi pro login
    }

    // 2. Navegar para Cadastro Militares
    await page.goto('/sgte/cadastro-militares');

    // Aceitar qualquer dialog (alert) automaticamente
    page.on('dialog', async (dialog) => {
      console.error(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    // 3. Cadastrar Militar
    await page.click('text="Novo Militar"'); // Botão ou link
    await page.waitForURL('**/sgte/cadastro-militares/novo');

    await page.fill('input[name="nomeGuerra"]', nomeRandom);
    await page.fill('input[name="nomeCompleto"]', `${nomeRandom} da Silva`);
    // Usa type para acionar máscaras
    await page.type('input[name="idtMil"]', ident, { delay: 10 });
    await page.type('input[name="cpf"]', '12345678901', { delay: 10 });
    await page.fill('input[name="cidade"]', 'São Paulo');
    await page.fill('input[name="dataPraca"]', '2020-01-01');
    await page.fill('input[name="dataNascimento"]', '1990-01-01');
    
    // Selects required
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

    // Esperar voltar para lista (aumentado para 45000ms devido a lentidao do NocoDB em ambiente de desenvolvimento)
    try {
      await page.waitForURL('**/sgte/cadastro-militares', { timeout: 45000 });
    } catch(e) {
      await page.screenshot({ path: 'test-error.png' });
      const formError = await page.locator('.bg-red-50').textContent().catch(() => 'No API error div');
      const invalidFields = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(':invalid')).map((el: any) => el.name || el.id);
      });
      console.log('API FORM ERROR:', formError);
      console.log('HTML5 INVALID FIELDS:', invalidFields);
      throw new Error(`Timeout waiting for URL. API Error: ${formError} | Invalid Fields: ${invalidFields.join(', ')}`);
    }

    // Busca o militar na tabela
    await page.fill('input[placeholder="Digite o nome de guerra ou nome completo..."]', nomeRandom);
    await page.waitForTimeout(1000); // Wait for debounce or filter
    
    await expect(page.locator(`text="${nomeRandom}"`).first()).toBeVisible({ timeout: 10000 });

    // 4. Acessar Perfil
    const row = page.locator('tr', { hasText: nomeRandom }).first();
    await row.locator('button[title="Ver perfil"]').click();

    await page.waitForURL('**/sgte/militares/**');
    // Comentario de organizacao: Aumenta o timeout para 45s para tolerar o carregamento lento do perfil vindo do NocoDB
    await expect(page.locator('h1', { hasText: nomeRandom })).toBeVisible({ timeout: 45000 });

    // 5. Testar abas do Perfil
    await page.click('text="Saúde"');
    await expect(page.locator('text="Visitas Médicas"')).toBeVisible();

    await page.click('button:has-text("Punições")');
    await expect(page.locator('text="Punições Recebidas"')).toBeVisible();

    // 6. Testar PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Exportar PDF")') // Pode ser icone, vamos buscar por texto ou label
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();

    // 7. Editar Militar
    await page.goto('/sgte/cadastro-militares');
    await page.fill('input[placeholder="Digite o nome de guerra ou nome completo..."]', nomeRandom);
    await page.waitForTimeout(1000);

    const rowEdit = page.locator('tr', { hasText: nomeRandom }).first();
    await rowEdit.locator('button[title="Editar"]').click(); // assume que o botão tem icone ou texto Editar

    await page.waitForURL('**/sgte/cadastro-militares/editar/**');
    await page.fill('input[name="nomeGuerra"]', `${nomeRandom} Editado`);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/sgte/cadastro-militares', { timeout: 45000 });
    } catch(e) {
      await page.screenshot({ path: 'test-edit-error.png' });
      const dom = await page.content();
      console.log('DOM NO ERRO DE EDIT:', dom);
      const formError = await page.locator('.bg-red-50').textContent().catch(() => 'No error div');
      throw new Error(`Edit Timeout waiting for URL. Error shown: ${formError}`);
    }
    
    await page.fill('input[placeholder="Digite o nome de guerra ou nome completo..."]', `${nomeRandom} Editado`);
    await page.waitForTimeout(1000);
    // Comentario de organizacao: Aumenta o timeout para 30s devido a lentidao do NocoDB ao recarregar a tabela
    await expect(page.locator(`text="${nomeRandom} Editado"`).first()).toBeVisible({ timeout: 30000 });

    // 8. Excluir Militar
    const rowDelete = page.locator('tr', { hasText: `${nomeRandom} Editado` }).first();
    await rowDelete.locator('button:has(.lucide-trash2), button[title="Excluir"]').click();
    
    // Confirmacao modal
    await page.click('button:has-text("Sim, Excluir")');
    
    // Comentario de organizacao: Aumenta o timeout para 30s para que o sumico do militar seja detectado apos a exclusao lenta no NocoDB
    await expect(page.locator(`text="${nomeRandom} Editado"`).first()).toBeHidden({ timeout: 30000 });
  });
});
