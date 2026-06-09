import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import crypto from 'crypto'; // Usado para gerar tokens aleatórios UUID de forma segura

// Instância personalizada do Axios configurada para se comunicar com o NocoDB
const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN // Autenticação por token do NocoDB
  }
});

/**
 * Mapeamento de tabelas no NocoDB
 * - mgjtgm3f60as8gd: Tabela de Usuários (credenciais e permissões)
 * - m5bfeui27vdb3rx: Tabela de Militares (registro e informações de praças/oficiais)
 * - mdjfqsz1aykfn4k: Tabela de Postos/Graduações (dados estáticos auxiliares)
 * - mw1qo1boiyngvse: Tabela de Companhias (dados estáticos auxiliares)
 * - m5qbo3gvgom1z4h (ou vindo do .env): Tabela de Refresh Tokens
 */
export class AuthService {
  
  /**
   * Método responsável por validar o login de um usuário e emitir o Access Token (JWT) e o Refresh Token.
   * O Refresh Token é salvo na tabela m5qbo3gvgom1z4h vinculando-se ao ID do usuário.
   */
  static async authenticate(email: string, senha: string, companhia: string) {
    try {
      // 1. Busca o usuário correspondente ao e-mail
      const response = await api.get(`/api/v2/tables/mgjtgm3f60as8gd/records`, {
        params: { where: `(email,eq,${email})` }
      });

      const records = response.data.list;
      if (records.length === 0) {
        throw new Error('Credenciais inválidas');
      }

      const user = records[0];
      // 2. Compara a senha informada
      const isMatch = await bcrypt.compare(senha, user.senha);

      if (!isMatch) {
        throw new Error('Credenciais inválidas');
      }

      // 3. Emite um Access Token JWT com expiração curta de 15 minutos para demonstração de segurança
      // Trata se a companhia vier como objeto, string ou array
      const compValue = companhia || user.companhia?.Id || user.companhia?.Companhia || (Array.isArray(user.companhia) ? (user.companhia[0]?.Id || user.companhia[0]?.Companhia) : user.companhia);

      const token = jwt.sign({
        // Adicionado fallback para obter o ID tanto com 'Id' quanto com 'id'
        id: user.Id || user.id,
        email: user.email,
        nivel_acesso: user.nivel_acesso,
        companhia: compValue
      }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

      // 4. Cria e persiste um Refresh Token criptograficamente seguro (UUID)
      const refreshToken = crypto.randomUUID();
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + 7); // Expiração de 7 dias

      // Primeiro criamos o registro de refresh token básico
      const tokenTableId = process.env.NOCODB_REFRESH_TOKEN_TABLE_ID || 'm5qbo3gvgom1z4h';
      const tokenRes = await api.post(`/api/v2/tables/${tokenTableId}/records`, {
        token: refreshToken,
        expire_at: expireAt.toISOString(),
        revoked: 'false'
      });
      const tokenId = tokenRes.data.Id;

      // Em seguida, criamos a associação LinkToAnotherRecord (Many-to-One) com a tabela usuarios
      // Adicionado fallback para user.Id ou user.id para evitar inconsistência de letras maiúsculas/minúsculas
      const userIdToLink = user.Id || user.id;
      await api.post(`/api/v2/tables/${tokenTableId}/links/ci02k3eu16h6ayt/records/${tokenId}`, {
        Id: userIdToLink
      });

      // 5. Atualiza o campo ultimo_acesso (DateTime) do usuário no NocoDB com o momento atual
      // Alterado para usar 'await' para garantir que a atualização seja concluída com sucesso no banco de dados antes de retornar
      try {
        await api.patch(`/api/v2/tables/mgjtgm3f60as8gd/records`, {
          Id: userIdToLink,
          ultimo_acesso: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('Aviso: Não foi possível atualizar ultimo_acesso:', err?.response?.data || err.message);
      }

      // Retorna ambos os tokens para serem salvos na sessão do cliente
      return { token, refreshToken };
    } catch (error: any) {
      console.error('Error authenticating:', error?.response?.data || error.message);
      throw new Error('Credenciais inválidas');
    }
  }

  /**
   * Método responsável por validar um Refresh Token existente e emitir um novo Access Token.
   */
  static async refresh(refreshToken: string) {
    try {
      // 1. Consulta o refresh token no NocoDB
      const response = await api.get(`/api/v2/tables/${process.env.NOCODB_REFRESH_TOKEN_TABLE_ID}/records`, {
        params: { where: `(token,eq,${refreshToken})` }
      });

      const records = response.data.list;
      if (records.length === 0) {
        throw new Error('Refresh token inválido ou não encontrado.');
      }

      const tokenRecord = records[0];

      // 2. Verifica se o token já foi revogado (armazenado como string 'true' no SingleSelect)
      if (tokenRecord.revoked === 'true') {
        throw new Error('Refresh token revogado.');
      }

      // 3. Verifica se o token expirou
      const expireDate = new Date(tokenRecord.expire_at);
      if (expireDate.getTime() < Date.now()) {
        throw new Error('Refresh token expirado.');
      }

      // 4. Busca os dados atualizados do usuário vinculado no NocoDB
      const userId = tokenRecord.email_usuario?.Id;
      if (!userId) {
        throw new Error('Usuário associado ao token não encontrado.');
      }

      const userResponse = await api.get(`/api/v2/tables/mgjtgm3f60as8gd/records/${userId}`);
      const user = userResponse.data;

      // Trata se a companhia vier como objeto, string ou array
      const compValue = user.companhia?.Id || user.companhia?.Companhia || (Array.isArray(user.companhia) ? (user.companhia[0]?.Id || user.companhia[0]?.Companhia) : user.companhia);

      // 5. Emite um novo Access Token (JWT) válido por 15 minutos
      const token = jwt.sign({
        id: user.Id,
        email: user.email,
        nivel_acesso: user.nivel_acesso,
        companhia: compValue
      }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

      return token;
    } catch (error: any) {
      console.error('Error refreshing token:', error?.response?.data || error.message);
      throw new Error('Não foi possível renovar a sessão.');
    }
  }

  /**
   * Método responsável por invalidar (revogar) um Refresh Token ativo no banco de dados (Logout).
   */
  static async logout(refreshToken: string) {
    try {
      // 1. Busca o registro do token no NocoDB para capturar seu ID primário
      const response = await api.get(`/api/v2/tables/${process.env.NOCODB_REFRESH_TOKEN_TABLE_ID}/records`, {
        params: { where: `(token,eq,${refreshToken})` }
      });

      const records = response.data.list;
      if (records.length > 0) {
        const tokenRecord = records[0];
        
        // 2. Faz uma atualização PATCH para marcar revoked como true (como string 'true' no SingleSelect)
        await api.patch(`/api/v2/tables/${process.env.NOCODB_REFRESH_TOKEN_TABLE_ID}/records`, {
          Id: tokenRecord.Id,
          revoked: 'true'
        });
      }
    } catch (error: any) {
      console.error('Error logging out:', error?.response?.data || error.message);
      // Não joga erro para cima para garantir que o cliente possa limpar sua sessão local mesmo em falhas do banco
    }
  }

  /**
   * Método responsável por registrar um novo usuário no sistema.
   * Cria um registro consolidado diretamente na tabela de Usuários (mgjtgm3f60as8gd)
   * contendo o nome completo, o posto/graduação e a companhia militar, removendo a 
   * necessidade de criar registros em outras tabelas.
   */
  static async register(userData: any) {
    try {
      const { nome, email, senha, companhia, pg } = userData;

      // 1. Verifica se o email informado já está registrado na tabela de usuários
      const checkResponse = await api.get(`/api/v2/tables/mgjtgm3f60as8gd/records`, {
        params: { where: `(email,eq,${email})` }
      });
      if (checkResponse.data.list.length > 0) {
        throw new Error('Usuário já existe');
      }

      // 2. Criptografa a senha informada usando salt rounds de 10
      const hashedPassword = await bcrypt.hash(senha, 10);

      // 3. Cria o registro básico do Usuário na tabela (mgjtgm3f60as8gd) contendo nome_completo
      const userResponse = await api.post(`/api/v2/tables/mgjtgm3f60as8gd/records`, {
        email: email,
        senha: hashedPassword,
        nivel_acesso: 'User',
        nome_completo: nome
      });

      const userId = userResponse.data.Id;

      // 4. Cria as associações de relacionamento usando a API de links do NocoDB (Many-to-One)
      if (pg) {
        try {
          await api.post(`/api/v2/tables/mgjtgm3f60as8gd/links/cehlja3g3hgzcxy/records/${userId}`, {
            Id: pg
          });
        } catch (linkError: any) {
          console.error(`Erro ao linkar posto_graduacao (ID: ${pg}) ao usuário ${userId}:`, linkError?.response?.data || linkError.message);
        }
      }

      if (companhia) {
        try {
          await api.post(`/api/v2/tables/mgjtgm3f60as8gd/links/cnrmkn1sbknio4o/records/${userId}`, {
            Id: companhia
          });
        } catch (linkError: any) {
          console.error(`Erro ao linkar companhia (ID: ${companhia}) ao usuário ${userId}:`, linkError?.response?.data || linkError.message);
        }
      }

      return {
        usuario: userResponse.data.email,
        companhia: companhia,
        pg: pg
      };
    } catch (error: any) {
      console.error('Error registering:', error?.response?.data || error.message);
      throw new Error('Erro ao registrar usuário');
    }
  }

  /**
   * Método responsável por obter dados estáticos (metadados) para os formulários
   * de cadastro/registro do frontend (tabelas de Postos/Graduações e Companhias).
   */
  static async getMetadata() {
    try {
      // Faz chamadas concorrentes usando Promise.all para melhorar a performance
      const [postosRes, companhiasRes] = await Promise.all([
        api.get('/api/v2/tables/mdjfqsz1aykfn4k/records'), // Tabela de Postos
        api.get('/api/v2/tables/mw1qo1boiyngvse/records')  // Tabela de Companhias
      ]);

      // Mapeia os dados do NocoDB para um formato simplificado para a resposta HTTP do frontend
      return {
        postos: postosRes.data.list.map((p: any) => ({ id: p.Id, nome: p.Posto || p.posto || p.Title })),
        companhias: companhiasRes.data.list.map((c: any) => ({ id: c.Id, nome: c.Companhia || c.companhia || c.Title }))
      };
    } catch (error: any) {
      console.error('Error fetching metadata:', error?.response?.data || error.message);
      throw new Error('Erro ao buscar dados estáticos');
    }
  }
}
