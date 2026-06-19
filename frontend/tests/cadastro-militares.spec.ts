import { test, expect } from '@playwright/test';

test.describe('Modais por Aba no Cadastro de Militares', () => {
  // Gera um nome único para o teste
  const nomeRandom = `Sgt Aba Teste ${Date.now()}`;
  const ident = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digitos

  test('Deve exibir modais específicos para cada aba e permitir edição', async ({ page }) => {
    test.setTimeout(90000);

    // Comentário de organização: Captura as mensagens do console do browser e as expõe nos logs do teste para depuração de erros
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
    });

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

    // Se ele navegar para /login, a gente faz o login (aumentado para 30s devido a lentidao do NocoDB)
    try {
      await page.waitForURL('**/login', { timeout: 30000 });
      await page.fill('input[id="email"]', userEmail);
      await page.fill('input[id="isenha"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/', { timeout: 30000 });
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

    // Comentário de organização: Aumenta o timeout para 45s para tolerar a gravação sequencial de 6 registros no NocoDB Cloud remoto de dev
    await page.waitForURL('**/sgte/cadastro-militares', { timeout: 45000 });

    await page.fill('input[placeholder="Digite o nome de guerra ou nome completo..."]', nomeRandom);
    await page.waitForTimeout(1000);

    // 3. Teste Aba Dados Pessoais: Edição completa e validação de salvamento
    // Comentário de organização: Usa o seletor button:has-text para garantir que clique no botão da aba e não em outro elemento
    await page.click('button:has-text("Dados Pessoais")');
    await page.waitForTimeout(500);

    // Comentário de organização: Seleciona o card do militar de teste na aba Dados Pessoais de forma robusta e clica no texto estático para evitar clique no link do perfil
    const rowCard = page.locator('div.cursor-pointer').filter({ hasText: nomeRandom }).first();
    await rowCard.locator('p:has-text("IDT Militar")').first().click();

    // Comentário de organização: Verifica se o modal abriu com os Dados Pessoais visíveis
    await expect(page.locator('text="Resumo do Militar"').first()).toBeVisible();
    await expect(page.locator('h4:has-text("Dados Pessoais")')).toBeVisible();
    await expect(page.locator('h4:has-text("Situação Funcional")')).toBeHidden();

    // Clica para habilitar a edição dos campos no modal
    await page.click('button:has-text("Atualizar Campos")');
    
    // Comentário de organização: Preenche todos os novos inputs adicionados ao formulário de Dados Pessoais
    await page.fill('input#modal-nomeGuerra', `${nomeRandom} Modificado`);
    await page.fill('input#modal-precCP', '654321');
    await page.fill('input#modal-numeroCampoBasico', '45');
    await page.fill('input#modal-dataPraca', '2021-08-20');
    
    // Salva as alteracoes feitas
    await page.click('button:has-text("Salvar Alterações")');
    // Comentario de organizacao: Aguarda o botao de edicao reaparecer na tela, indicando que o salvamento no NocoDB foi concluido
    await expect(page.locator('button:has-text("Atualizar Campos")').first()).toBeVisible({ timeout: 45000 });

    // Comentário de organização: Valida se as informações atualizadas aparecem corretamente no modo de visualização do modal diretamente através de IDs explícitos (com tolerância de 20s para lentidão do NocoDB)
    await expect(page.locator('#detalhe-precCP')).toHaveText('654321', { timeout: 20000 });
    await expect(page.locator('#detalhe-numeroCampoBasico')).toHaveText('45', { timeout: 20000 });
    await expect(page.locator('#detalhe-nomeGuerra')).toHaveText(`${nomeRandom} Modificado`, { timeout: 20000 });

    await page.click('button:has-text("Fechar")');

    // 4. Teste Aba Situação Funcional: Edição completa, select dinâmico de funções e autocomplete de substituto
    // Comentário de organização: Usa o seletor button:has-text para garantir que clique no botão da aba e não em outro elemento
    await page.click('button:has-text("Situação Funcional")');
    await page.waitForTimeout(500);

    // Comentário de organização: Clica no card do militar na aba de Situação Funcional para abrir o modal
    const rowSituacao = page.locator('div.cursor-pointer').filter({ hasText: `${nomeRandom} Modificado` }).first();
    await rowSituacao.locator('p:has-text("Posto/Grad (Cargo)")').first().click();

    // Comentário de organização: Verifica se o modal abriu exibindo a aba de Situação Funcional
    await expect(page.locator('h4:has-text("Situação Funcional")')).toBeVisible();
    await expect(page.locator('h4:has-text("Dados Pessoais")')).toBeHidden();

    await page.click('button:has-text("Atualizar Campos")');
    
    // Altera a situação funcional
    await page.selectOption('select#modal-situacao-estado', { label: 'Ativo' });
    await page.selectOption('select#modal-situacao-pelotao', { label: '2º PEL' });

    // Comentário de organização: Seleciona uma função na Cia caso exista alguma cadastrada no select dinâmico
    const selectFuncao = page.locator('select#modal-situacao-funcaoId');
    const optionCount = await selectFuncao.locator('option').count();
    if (optionCount > 1) {
      await selectFuncao.selectOption({ index: 1 });
    }

    // Comentário de organização: Busca e seleciona o próprio militar de teste como substituto usando o autocomplete
    await page.fill('input#modal-situacao-substituto-busca', nomeRandom);
    await page.waitForTimeout(1000); // Aguarda aparecer as opções do auto-complete
    
    const resultadoItem = page.locator('ul.max-h-32 li').first();
    if (await resultadoItem.isVisible()) {
      await resultadoItem.locator('button:has-text("Selecionar")').click();
    }

    // Salva as alteracoes feitas na situacao funcional
    await page.click('button:has-text("Salvar Alterações")');
    // Comentario de organizacao: Aguarda o botao de edicao reaparecer na tela, indicando que o salvamento no NocoDB foi concluido
    await expect(page.locator('button:has-text("Atualizar Campos")').first()).toBeVisible({ timeout: 45000 });

    // Comentário de organização: Valida se as alterações foram salvas com sucesso diretamente no modal usando IDs (com tolerância de 20s para lentidão do NocoDB)
    await expect(page.locator('#detalhe-situacao-pelotao')).toHaveText('2º PEL', { timeout: 20000 });
    await expect(page.locator('#detalhe-situacao-estado')).toHaveText('Ativo', { timeout: 20000 });
    
    await page.click('button:has-text("Fechar")');

    // 5. Teste Aba Documentos
    // Comentário de organização: Usa o seletor button:has-text para garantir que clique no botão da aba e evite o link homônimo no menu lateral
    await page.click('button:has-text("Documentos")');
    await page.waitForTimeout(1000);

    // Comentário de organização: Captura screenshot da tela para diagnosticar o estado da aba de Documentos no teste
    await page.screenshot({ path: 'screenshot-error.png' });

    // Comentário de organização: Clica no card na aba de documentos
    const rowDocs = page.locator('div.cursor-pointer').filter({ hasText: `${nomeRandom} Modificado` }).first();
    await rowDocs.locator('p:has-text("Identidade Militar")').first().click();

    await expect(page.locator('h4:has-text("Documentos")')).toBeVisible();
    await expect(page.locator('h4:has-text("Dados Pessoais")')).toBeHidden();
    
    await page.click('button:has-text("Fechar")');
  });
});
// Comentário de organização: Fim dos testes de modais por aba no cadastro de militares
