import type { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// Configuração do cliente NocoDB para comunicação com a API
// ─────────────────────────────────────────────────────────────────────────────
const NOCODB_URL   = process.env.NOCODB_API_URL  || 'https://nocodb.alexdatawise.cloud';
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN || 'nc_pat_GdZStg4K7cJMNMf32gyh3FArJc3kkwGeVie1v1Hi';

// Comentário de organização: ID da tabela de histórico de alterações no NocoDB
// Colunas: campo_alteracao, valor_anterior, valor_novo, tipo_alteracao, data, usuario_responsavel, militar_envolvido
const TBL_HISTORICO = 'ml7fddu63zljsta';

// Comentário de organização: Helper para realizar requisições autenticadas ao NocoDB V2
async function nocoRequest(path: string, opts: RequestInit = {}): Promise<any> {
  const url = `${NOCODB_URL}/api/v2/tables${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'xc-token': NOCODB_TOKEN,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NocoDB error ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoricoController — endpoints para leitura e criação do histórico
// Apenas registros de ações relacionadas ao militar são expostos
// ─────────────────────────────────────────────────────────────────────────────
export class HistoricoController {

  /**
   * GET /api/historico
   * Retorna todos os registros do histórico ordenados do mais recente ao mais antigo.
   * Suporta filtros opcionais via query params: militar (busca por nome), tipo.
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { militar, tipo, limit = '300' } = req.query as Record<string, string>;

      // Comentário de organização: Monta filtros NocoDB conforme os nomes reais das colunas
      const where: string[] = [];
      if (militar) where.push(`(militar_envolvido,like,%${militar}%)`);
      if (tipo && tipo !== 'Todos') where.push(`(tipo_alteracao,eq,${tipo})`);

      const whereStr = where.length > 0 ? `&where=${encodeURIComponent(where.join('~and'))}` : '';

      // Comentário de organização: Ordena por campo "data" decrescente (mais recente primeiro)
      const data = await nocoRequest(
        `/${TBL_HISTORICO}/records?limit=${limit}&sort=-data${whereStr}`
      );

      // Comentário de organização: Mapeia as colunas reais do banco para o formato do frontend
      // Busca militares para enriquecer o M2M com nomes
      const militaresRes = await nocoRequest(`/m5bfeui27vdb3rx/records?limit=1000`);
      const militaresMap = new Map();
      if (militaresRes && militaresRes.list) {
        militaresRes.list.forEach((m: any) => {
          militaresMap.set(m.Id, m.nome_guerra || m.nome_completo || `ID ${m.Id}`);
        });
      }

      const registros = await Promise.all((data.list || []).map(async (h: any) => {
        let militarStr = h.militar_envolvido || '';
        
        // Se for um M2M array contendo o ID do militar, podemos mapear para o nome
        if (h._nc_m2m_historico_logs_militares && h._nc_m2m_historico_logs_militares.length > 0) {
           const milId = h._nc_m2m_historico_logs_militares[0].militares_id;
           militarStr = militaresMap.get(milId) || `ID ${milId}`;
        } else if (typeof h.militar_envolvido === 'object' && h.militar_envolvido !== null) {
           militarStr = h.militar_envolvido.nome_guerra || h.militar_envolvido.nome_completo || `ID ${h.militar_envolvido.Id}`;
        }

        // Se a string do militar estiver vazia (comum após Exclusão devido ao registro ter sido apagado),
        // extrair o nome do militar diretamente da string "valor_anterior", onde ele fica registrado.
        if (h.tipo_alteracao === 'Exclusão' && (!militarStr || militarStr.startsWith('ID '))) {
           const match = (h.valor_anterior || '').match(/^Militar\s+(.+)$/);
           if (match) {
             militarStr = match[1];
           }
        }

        let usuarioStr = '';
        if (typeof h.usuario_responsavel === 'object' && h.usuario_responsavel !== null) {
           usuarioStr = h.usuario_responsavel.email || h.usuario_responsavel.nome_completo || `ID ${h.usuario_responsavel.Id}`;
        } else if (h._nc_m2m_historico_logs_usuarios && h._nc_m2m_historico_logs_usuarios.length > 0) {
           const uObj = h._nc_m2m_historico_logs_usuarios[0];
           usuarioStr = uObj.usuarios?.email || uObj.usuarios?.nome_completo || `ID Usuário ${uObj.usuarios_id}`;
        } else if (typeof h.usuario_responsavel === 'string') {
           usuarioStr = h.usuario_responsavel;
        }

        return {
          id: h.Id,
          campo_alteracao: h.campo_alteracao || h.campo_alterado || '—',
          valor_anterior: h.valor_anterior || '',
          valor_novo: h.valor_novo || '',
          tipo_alteracao: h.tipo_alteracao || '',
          data: h.data || h.criado_em || '',
          usuario_responsavel: usuarioStr,
          militar_envolvido: militarStr,
        };
      }));

      res.status(200).json(registros);
    } catch (error: any) {
      console.error('[HistoricoController] Erro ao buscar histórico:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao buscar histórico.' });
    }
  }

  /**
   * POST /api/historico
   * Registra uma nova entrada no histórico de alterações.
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        campo_alteracao, valor_anterior, valor_novo,
        tipo_alteracao, usuario_responsavel, militar_envolvido
      } = req.body;

      // Comentário de organização: Cria o registro usando os nomes reais das colunas do banco
      const payload: any = {
        campo_alterado:      campo_alteracao     || '',
        valor_anterior:      valor_anterior      || '',
        valor_novo:          valor_novo          || '',
        tipo_alteracao:      tipo_alteracao      || 'Atualização',
        data:                new Date().toISOString(),
      };

      if (usuario_responsavel) payload.usuario_responsavel = usuario_responsavel;
      if (militar_envolvido) payload.militar_envolvido = militar_envolvido;

      const created = await nocoRequest(`/${TBL_HISTORICO}/records`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      res.status(201).json({ id: created.Id, ...payload });
    } catch (error: any) {
      console.error('[HistoricoController] Erro ao criar registro de histórico:', error);
      res.status(500).json({ error: error.message || 'Erro ao registrar no histórico.' });
    }
  }
}
