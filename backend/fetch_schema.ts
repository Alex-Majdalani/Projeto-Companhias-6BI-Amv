import axios from 'axios';
import 'dotenv/config';

/**
 * Função assíncrona responsável por consultar a estrutura do banco de dados (schema)
 * hospedado no NocoDB. Ela descobre as "bases" configuradas e, em seguida, lista 
 * todas as tabelas associadas à primeira base encontrada.
 */
async function fetchSchema() {
  try {
    // 1. Faz uma requisição GET para obter a lista de todas as bases de dados (projetos) do NocoDB.
    // Usamos o cabeçalho 'xc-token' com a chave de API fornecida pelo NocoDB para autenticação.
    const res = await axios.get(`${process.env.NOCODB_URL}/api/v2/meta/bases`, {
      headers: { 'xc-token': process.env.NOCODB_TOKEN }
    });
    console.log("Bases localizadas no NocoDB:", JSON.stringify(res.data, null, 2));

    // 2. Tendo pelo menos uma base de dados ativa no projeto, extraímos o ID da primeira.
    const baseId = res.data.list[0].id;
    
    // 3. Faz uma requisição GET para listar todas as tabelas (tabelas de militares, usuários, etc.) 
    // existentes dentro dessa base específica no NocoDB.
    const tablesRes = await axios.get(`${process.env.NOCODB_URL}/api/v2/meta/bases/${baseId}/tables`, {
      headers: { 'xc-token': process.env.NOCODB_TOKEN }
    });
    
    // 4. Mapeia e exibe no console o título e o ID gerado pelo NocoDB para cada tabela.
    // O ID da tabela (geralmente começando com 'm...') é essencial para realizarmos operações de CRUD posteriores.
    console.log("Tabelas da base ativa:", JSON.stringify(tablesRes.data.list.map((t: any) => ({ title: t.title, id: t.id })), null, 2));
  } catch (error) {
    // Tratamento de erro robusto separando erros do Axios (HTTP) de erros gerais de JavaScript
    if (axios.isAxiosError(error)) {
      console.error("Erro de API ao buscar schema do NocoDB:", error.response ? error.response.data : error.message);
    } else {
      console.error("Erro desconhecido ao buscar schema:", error instanceof Error ? error.message : error);
    }
  }
}

// Executa a função para fins de depuração
fetchSchema();
