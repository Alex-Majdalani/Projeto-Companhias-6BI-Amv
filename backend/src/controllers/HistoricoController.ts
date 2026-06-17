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
      const registros = (data.list || []).map((h: any) => ({
        id: h.Id,
        campo_alteracao: h.campo_alteracao || h.campo_alterado || '—',
        valor_anterior: h.valor_anterior || '',
        valor_novo: h.valor_novo || '',
        tipo_alteracao: h.tipo_alteracao || '',
        data: h.data || h.criado_em || '',
        usuario_responsavel: h.usuario_responsavel || '',
        militar_envolvido: h.militar_envolvido || '',
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
      const body = {
        campo_alteracao:     campo_alteracao     || '',
        valor_anterior:      valor_anterior      || '',
        valor_novo:          valor_novo          || '',
        tipo_alteracao:      tipo_alteracao      || 'Atualização',
        usuario_responsavel: usuario_responsavel || '',
        militar_envolvido:   militar_envolvido   || '',
        data:                new Date().toISOString(),
      };

      const created = await nocoRequest(`/${TBL_HISTORICO}/records`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      res.status(201).json({ id: created.Id, ...body });
    } catch (error: any) {
      console.error('[HistoricoController] Erro ao criar registro de histórico:', error);
      res.status(500).json({ error: error.message || 'Erro ao registrar no histórico.' });
    }
  }
}
