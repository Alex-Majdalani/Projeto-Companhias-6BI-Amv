import type { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// Configuração do cliente NocoDB para comunicação com a API
// ─────────────────────────────────────────────────────────────────────────────
const NOCODB_URL   = process.env.NOCODB_API_URL  || process.env.NOCODB_URL  || '';
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN || process.env.NOCODB_TOKEN || '';

// Comentário de organização: ID da tabela de histórico de alterações no NocoDB
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
// HistoricoController — endpoints para leitura do histórico de alterações
// ─────────────────────────────────────────────────────────────────────────────
export class HistoricoController {

  /**
   * GET /api/historico
   * Retorna todos os registros do histórico de alterações, do mais recente ao mais antigo.
   * Suporta filtros opcionais via query params: militarId, usuarioId, tipoAlteracao.
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { militarId, usuarioId, tipoAlteracao, limit = '200' } = req.query as Record<string, string>;

      // Monta filtros NocoDB
      const where: string[] = [];
      if (militarId)       where.push(`(militar_id,eq,${militarId})`);
      if (usuarioId)       where.push(`(usuario_id,eq,${usuarioId})`);
      if (tipoAlteracao)   where.push(`(tipo_alteracao,like,${tipoAlteracao}%)`);

      const whereStr = where.length > 0 ? `&where=${encodeURIComponent(where.join('~and'))}` : '';

      // Comentário de organização: Ordena por data decrescente (mais recente primeiro)
      const data = await nocoRequest(
        `/${TBL_HISTORICO}/records?limit=${limit}&sort=-criado_em${whereStr}`
      );

      const registros = (data.list || []).map((h: any) => ({
        id: h.Id,
        militarId: h.militar_id,
        usuarioId: h.usuario_id,
        campoAlterado: h.campo_alterado || '',
        valorAnterior: h.valor_anterior || '',
        valorNovo: h.valor_novo || '',
        tipoAlteracao: h.tipo_alteracao || '',
        observacao: h.observacao || '',
        data: h.criado_em || '',
        // Campos de link (nomes resolvidos pelo NocoDB, se houver)
        militar_envolvido: h.militar_envolvido?.nome_guerra || h.militar_envolvido?.Title || h.militar_id || '',
        usuario_responsavel: h.usuario_responsavel?.Title || h.usuario_id || '',
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
   * Chamado internamente por outros controllers quando há uma alteração de dado.
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        militar_id, usuario_id, campo_alterado,
        valor_anterior, valor_novo, tipo_alteracao, observacao
      } = req.body;

      // Comentário de organização: Cria o registro com a data/hora atual
      const body = {
        militar_id:     militar_id    || null,
        usuario_id:     usuario_id    || null,
        campo_alterado: campo_alterado || '',
        valor_anterior: valor_anterior || '',
        valor_novo:     valor_novo     || '',
        tipo_alteracao: tipo_alteracao || 'atualização',
        observacao:     observacao     || '',
        criado_em:      new Date().toISOString(),
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
