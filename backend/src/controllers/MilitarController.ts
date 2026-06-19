import type { Request, Response } from 'express';

const NOCODB_URL = process.env.NOCODB_API_URL || 'https://nocodb.alexdatawise.cloud';
const XC_TOKEN = process.env.NOCODB_API_TOKEN || 'nc_pat_GdZStg4K7cJMNMf32gyh3FArJc3kkwGeVie1v1Hi';

// Tabelas do NocoDB
const TBL_CIVIL = 'mtixj1e4vmt6ktl';
const TBL_ENDERECO = 'mw8mh2g0x0rxbk1';
const TBL_CONTATO = 'm2xy5pm7hw68n2f';
const TBL_MILITAR = 'm5bfeui27vdb3rx';
const TBL_REDES_SOCIAIS = 'mw1va9kecnl1c16';
const TBL_ESPECIALIDADES_MILITAR = 'mbfumyosimeqpa6';
const TBL_HISTORICO_LOGS = 'ml7fddu63zljsta';

// Helper para chamadas fetch no NocoDB
async function nocoRequest(path: string, options: RequestInit = {}) {
  const url = `${NOCODB_URL}/api/v2${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'xc-token': XC_TOKEN,
      ...(options.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('NocoDB Error details:', data);
    throw new Error(data.msg || data.message || `Erro na chamada NocoDB: ${response.status}`);
  }
  return data;
}

// Comentário de organização: Helper para registrar log de ações no historico_logs.
// Apenas ações relacionadas ao militar são registradas (criação, atualização, exclusão).
// Erros de log não interrompem o fluxo principal.
async function registrarLog(opts: {
  tipo_alteracao: 'Criação' | 'Atualização' | 'Exclusão';
  campo_alteracao: string;
  valor_anterior?: string;
  valor_novo?: string;
  usuario_responsavel?: string | number;
  militar_envolvido?: string | number;
}) {
  try {
    const payload: any = {
      tipo_alteracao: opts.tipo_alteracao,
      campo_alterado: opts.campo_alteracao, // O NocoDB utiliza "campo_alterado"
      valor_anterior: opts.valor_anterior || '',
      valor_novo: opts.valor_novo || '',
      data: new Date().toISOString(),
    };

    if (opts.usuario_responsavel) payload.usuario_responsavel = opts.usuario_responsavel;
    if (opts.militar_envolvido) payload.militar_envolvido = [{ Id: opts.militar_envolvido }];

    await nocoRequest(`/tables/${TBL_HISTORICO_LOGS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (logErr) {
    // Log de historico nunca deve quebrar o fluxo principal
    console.warn('Aviso: Falha ao registrar historico_log:', logErr);
  }
}

// Comentário de organização: Helpers para mapear opções do frontend para o NocoDB.
// Retornam null quando o campo está vazio para não gravar valores default indesejados.
function mapFatorRh(fator: string): string | null {
  if (!fator) return null;
  if (fator === '+') return 'Positivo (+)';
  if (fator === '-') return 'Negativo (-)';
  return fator;
}

function mapCutis(cutis: string): string | null {
  if (!cutis) return null;
  return cutis.charAt(0).toUpperCase() + cutis.slice(1).toLowerCase();
}

function mapOlhos(olhos: string): string | null {
  if (!olhos) return null;
  return olhos.charAt(0).toUpperCase() + olhos.slice(1).toLowerCase();
}

function mapCabelos(cabelos: string): string | null {
  if (!cabelos) return null;
  const val = cabelos.toLowerCase();
  if (val.startsWith('preto')) return 'Preto';
  if (val.startsWith('castanho')) return 'Castanho';
  if (val.startsWith('loiro')) return 'Loiro';
  if (val.startsWith('ruivo')) return 'Ruivo';
  if (val.startsWith('grisalho') || val.startsWith('branco')) return 'Grisalho / Branco';
  return cabelos;
}

function mapEscolaridade(esc: string): string | null {
  if (!esc) return null;
  const map: Record<string, string> = {
    fundamental_inc: 'Fundamental Incompleto',
    fundamental_com: 'Fundamental Completo',
    medio_inc: 'Médio Incompleto',
    medio_com: 'Médio Completo',
    superior_inc: 'Superior Incompleto',
    superior_com: 'Superior Completo'
  };
  return map[esc] || null;
}

function mapTipoSanguineo(ts: string): string | null {
  if (!ts) return null;
  return ts.toUpperCase();
}

function mapPostoGraduacao(posto: string): string | null {
  if (!posto) return null;
  const map: Record<string, string> = {
    cel: 'CEL', tc: 'TC', maj: 'MAJ', cap: 'CAP',
    '1ten': '1º TEN', '2ten': '2º TEN', asp: 'ASP', st: 'ST',
    '1sgt': '1º SGT', '2sgt': '2º SGT', '3sgt': '3º SGT',
    cb: 'CB', sdep: 'SD EP', sdev: 'SD EV'
  };
  return map[(posto || '').toLowerCase()] || null;
}

function mapCompanhiaId(comp: string): number {
  const c = (comp || '').toLowerCase();
  if (c.includes('1')) return 1;
  if (c.includes('2')) return 2;
  if (c.includes('3')) return 3;
  return 4; // CIA C AP
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export class MilitarController {
  static async listCompanhias(req: Request, res: Response) {
    try {
      const data = await nocoRequest('/tables/mw1qo1boiyngvse/records?limit=100');
      const list = (data.list || [])
        .filter((c: any) => c.Companhia)
        .map((c: any) => ({
          id: c.Id,
          companhia: c.Companhia.trim()
        }));
      return res.status(200).json(list);
    } catch (error: any) {
      console.error('Erro ao listar companhias:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listPelotoes(req: Request, res: Response) {
    try {
      const data = await nocoRequest('/meta/columns/c8ba7lhygcko39x');
      const options = (data.colOptions?.options || []).map((opt: any) => opt.title);
      return res.status(200).json(options);
    } catch (error: any) {
      console.error('Erro ao listar pelotões:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      // Comentário de organização: Filtros recebidos via query params
      const { nome, postoGraduacao, situacao, companhia, pelotao, tipoVinculo } = req.query as Record<string, string>;

      // Monta o where do NocoDB baseado nos filtros recebidos
      const whereConditions: string[] = [];

      if (postoGraduacao && postoGraduacao !== 'Todos') {
        whereConditions.push(`(posto_graduacao,eq,${postoGraduacao})`);
      }
      if (pelotao && pelotao !== 'Todos') {
        whereConditions.push(`(pelotao,eq,${pelotao})`);
      }
      if (tipoVinculo && tipoVinculo !== 'Todos') {
        whereConditions.push(`(tipo_vinculo,eq,${tipoVinculo})`);
      }

      const whereStr = whereConditions.length > 0 ? `&where=${encodeURIComponent(whereConditions.join('~and'))}` : '';
      const nestedStr = `&nested[dados_civil][fields]=Id,nome_completo,cpf,foto_url&nested[funcao_efetivo_cia][fields]=Id,funcao,ativa,substituto&nested[funcao_substituto_cia][fields]=Id,funcao,ativa,efetivo`;
      const data = await nocoRequest(`/tables/${TBL_MILITAR}/records?limit=200${whereStr}${nestedStr}`);
      
      let formatados = (data.list || []).map((m: any) => {
        // Formatar funções
        const funcoesEfetivo = Array.isArray(m.funcao_efetivo_cia) ? m.funcao_efetivo_cia : [];
        const funcoesSubstituto = Array.isArray(m.funcao_substituto_cia) ? m.funcao_substituto_cia : [];
        
        return {
        id: m.Id,
        posto: m.posto_graduacao || 'SD EP',
        nome: m.dados_civil?.nome_completo || m.nome_guerra || 'Sem Nome',
        nomeGuerra: m.nome_guerra || '',
        identidade: m.idt_militar || '',
        cpf: m.dados_civil?.cpf || '',
        quadro: m.posto_graduacao || '',
        subunidade: m.companhia?.Companhia || '',
        companhia: m.companhia?.Companhia || '',
        pelotao: m.pelotao || '',
        tipoVinculo: m.tipo_vinculo || '',
        turmaFormacao: m.turma_formacao || '',
        situacao: m.situacao || 'Ativo',
        tipo: m.tipo_vinculo || 'Militar Temporário',
        cursosProfissionais: m.especialidades_militar?.cursos_gerais || '',
        precCP: m.prec_cp || '',
        numeroCampoBasico: m.numero_campo_basico || '',
        numeroEbca: m.numero_ebca || '',
        dataPraca: m.data_praca || '',
        funcoesEfetivo: funcoesEfetivo.map((f: any) => ({
          id: f.Id,
          funcao: f.funcao,
          ativa: f.ativa,
          substituto: f.substituto?.nome_guerra || ''
        })),
        funcoesSubstituto: funcoesSubstituto.map((f: any) => ({
          id: f.Id,
          funcao: f.funcao,
          ativa: f.ativa,
          efetivo: f.efetivo?.nome_guerra || ''
        })),
        fotoUrl: Array.isArray(m.dados_civil?.foto_url) && m.dados_civil.foto_url.length > 0
          ? m.dados_civil.foto_url[0].url || m.dados_civil.foto_url[0].signedUrl || ''
          : (typeof m.dados_civil?.foto_url === 'string' && m.dados_civil.foto_url.startsWith('[')
              ? (() => {
                  try {
                    const parsed = JSON.parse(m.dados_civil.foto_url);
                    return parsed[0]?.url || parsed[0]?.signedUrl || '';
                  } catch { return m.dados_civil.foto_url; }
                })()
              : m.dados_civil?.foto_url || ''),
        // IDs relacionados para operações de exclusão
        dadosCivilId: typeof m.dados_civil === 'object' ? m.dados_civil?.Id : m.dados_civil,
        enderecoId: typeof m.endereco === 'object' ? m.endereco?.Id : m.endereco,
        contatoId: typeof m.formas_contato === 'object' ? m.formas_contato?.Id : m.formas_contato,
        redesSociaisId: typeof m.redes_sociai === 'object' ? m.redes_sociai?.Id : m.redes_sociai,
        especialidadesId: typeof m.especialidades_militar === 'object' ? m.especialidades_militar?.Id : m.especialidades_militar,
        };
      });

      // Filtro por nome (busca parcial no nome completo ou nome de guerra)
      if (nome && nome.trim()) {
        const nomeLower = nome.toLowerCase().trim();
        formatados = formatados.filter((m: any) =>
          m.nome.toLowerCase().includes(nomeLower) ||
          m.nomeGuerra.toLowerCase().includes(nomeLower)
        );
      }

      // Filtro por companhia (NocoDB não suporta filtro por campo relacionado facilmente)
      if (companhia && companhia !== 'Todas') {
        formatados = formatados.filter((m: any) =>
          m.companhia.toLowerCase().includes(companhia.toLowerCase())
        );
      }

      return res.status(200).json(formatados);
    } catch (error: any) {
      console.error('Erro ao listar militares:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const body = req.body;
      console.log('Recebido para cadastro:', body);

      // Tratamento de altura: substituir vírgula por ponto
      let alturaNum: number | null = null;
      if (body.altura !== undefined && body.altura !== null && body.altura !== '') {
        const alturaStr = String(body.altura).replace(',', '.');
        alturaNum = parseFloat(alturaStr);
      }

      // Tratamento de CNH: Array de categorias ou ["Nenhum"]
      let cnhCategorias: string[] = [];
      if (Array.isArray(body.cnhCategoria)) {
        cnhCategorias = body.cnhCategoria;
      } else if (body.cnhCategoria && body.cnhCategoria !== 'nenhuma') {
        cnhCategorias = [body.cnhCategoria];
      }
      if (cnhCategorias.length === 0) {
        cnhCategorias = ['Nenhum'];
      }

      // Tratamento de Companhia: se for ID numérico direto do select dinâmico
      let companhiaId: number | null = null;
      if (body.secaoCompanhia) {
        const parsed = parseInt(body.secaoCompanhia);
        if (!isNaN(parsed)) {
          companhiaId = parsed;
        } else {
          companhiaId = mapCompanhiaId(body.secaoCompanhia);
        }
      }

      // Mapear tipo_vinculo para NocoDB Single Select
      let tipoVinculo = body.tipoVinculo || body.tipoMilitar || 'Militar Temporário';
      if (tipoVinculo === 'temporario' || tipoVinculo === 'Militar Temporário') {
        tipoVinculo = 'Militar Temporário';
      } else if (tipoVinculo === 'carreira' || tipoVinculo === 'Militar de Carreira') {
        tipoVinculo = 'Militar de Carreira';
      }

      // 1. Criar dados civil
      // Comentário de organização: Apenas envia campos que foram preenchidos.
      // Campos select vazios retornam null e não são gravados com valores default.
      const dadosCivilBody: Record<string, any> = {
        nome_completo: toTitleCase(body.nomeCompleto || body.nome_completo || '') || null,
        data_nascimento: body.dataNascimento || null,
        idade: null, // Pode ser calculado depois no frontend/backend
        sexo: body.sexo || null,
        // Comentário de organização: Campo estado_civil adicionado conforme nova coluna na tabela dados_civil
        estado_civil: body.estadoCivil || null,
        cpf: body.cpf || null,
        idt_civil: body.idtCivil || null,
        altura: alturaNum,
        tipo_sanquineo: mapTipoSanguineo(body.tipoSanguineo),
        fator_rh: mapFatorRh(body.fatorRh),
        cutis: mapCutis(body.cutis),
        olhos: mapOlhos(body.olhos),
        cabelos: mapCabelos(body.cabelos),
        religiao: body.religiao || null,
        escolaridade: mapEscolaridade(body.escolaridade),
        cnh_categoria: cnhCategorias.includes('Nenhum') ? null : (cnhCategorias.length > 0 ? cnhCategorias : null),
        nome_mae: toTitleCase(body.nomeMae || '') || null,
        nome_pai: toTitleCase(body.nomePai || '') || null,
        // Comentário de organização: URL da foto salva no S3, enviada pelo frontend após upload no momento do submit
        foto_url: body.fotoUrl || null
      };

      // Remove campos com valor null para não poluir o banco
      Object.keys(dadosCivilBody).forEach(k => {
        if (dadosCivilBody[k] === null || dadosCivilBody[k] === undefined) {
          delete dadosCivilBody[k];
        }
      });

      console.log('Salvando dados_civil...');
      const civil = await nocoRequest(`/tables/${TBL_CIVIL}/records`, {
        method: 'POST',
        body: JSON.stringify(dadosCivilBody)
      });

      // 2. Criar endereço
      const enderecoBody = {
        cep: body.cep || '',
        rua: toTitleCase(body.rua || ''),
        numero: body.numeroResidencial || body.numero || '',
        complemento: body.complemento || '',
        bairro: toTitleCase(body.bairro || ''),
        cidade: toTitleCase(body.cidade || ''),
        uf: (body.uf || '').toUpperCase()
      };

      console.log('Salvando endereço...');
      const endereco = await nocoRequest(`/tables/${TBL_ENDERECO}/records`, {
        method: 'POST',
        body: JSON.stringify(enderecoBody)
      });

      // 3. Criar formas de contato
      const contatoBody = {
        telefone: body.telefoneCelular || '',
        coabitacao: body.resideCom || '',
        telefone_emergencia: body.telefoneEmergencia || '',
        nome_emergencia: toTitleCase(body.nomeEmergencia || ''),
        grau_parentesco_emergencia: body.grauParentesco || ''
      };

      console.log('Salvando formas_contato...');
      const contato = await nocoRequest(`/tables/${TBL_CONTATO}/records`, {
        method: 'POST',
        body: JSON.stringify(contatoBody)
      });

      // 3.5. Criar redes sociais
      const redesSociaisBody = {
        instagram: body.instagram || '',
        facebook: body.facebook || '',
        tiktok: body.tiktok || '',
        twitter: body.twitter || '',
        outras_redes: body.outrasRedes || ''
      };

      console.log('Salvando redes_sociais...');
      const redesSociais = await nocoRequest(`/tables/${TBL_REDES_SOCIAIS}/records`, {
        method: 'POST',
        body: JSON.stringify(redesSociaisBody)
      });

      // 3.7. Criar especialidades_militar
      const especialidadesMilitarBody = {
        cursos_gerais: body.cursosProfissionais || ''
      };

      console.log('Salvando especialidades_militar...');
      const especialidadesMilitar = await nocoRequest(`/tables/${TBL_ESPECIALIDADES_MILITAR}/records`, {
        method: 'POST',
        body: JSON.stringify(especialidadesMilitarBody)
      });

      // 4. Criar militar no NocoDB vinculando tudo
      // Comentário de organização: Mapeamento dos novos campos prec_cp, numero_campo_basico e numero_ebca no create
      const militarBody: Record<string, any> = {
        nome_guerra: toTitleCase(body.nomeGuerra || '') || null,
        idt_militar: body.idtMil || body.idtMilitar || null,
        numero_campo_basico: body.numeroCampoBasico ? parseInt(body.numeroCampoBasico) : null,
        numero_ebca: body.numeroEbca ? parseInt(body.numeroEbca) : null,
        prec_cp: body.precCP || null,
        data_praca: body.dataPraca || null,
        turma_formacao: body.turmaFormacao ? parseInt(body.turmaFormacao) : null,
        dados_civil: civil.Id,
        endereco: endereco.Id,
        formas_contato: contato.Id,
        redes_sociai: redesSociais.Id,
        especialidades_militar: especialidadesMilitar.Id,
        posto_graduacao: mapPostoGraduacao(body.postoGraduacao),
        companhia: companhiaId,
        tipo_vinculo: tipoVinculo || null,
        pelotao: body.pelotao || null,
        situacao: body.situacao || null,
        periodo_obrigatorio: body.periodoObrigatorio || null
      };

      // Remove campos null para não poluir o banco
      Object.keys(militarBody).forEach(k => {
        if (militarBody[k] === null || militarBody[k] === undefined) {
          delete militarBody[k];
        }
      });

      console.log('Salvando militar...');
      const militar = await nocoRequest(`/tables/${TBL_MILITAR}/records`, {
        method: 'POST',
        body: JSON.stringify(militarBody)
      });

      // Comentário de organização: Registra log de criação do militar no historico_logs
      const nomeGuerra = toTitleCase(body.nomeGuerra || '') || `ID ${militar.Id}`;
      await registrarLog({
        tipo_alteracao: 'Criação',
        campo_alteracao: 'Cadastro completo',
        valor_anterior: '',
        valor_novo: `Militar cadastrado com posto ${mapPostoGraduacao(body.postoGraduacao) || body.postoGraduacao || '—'} e nome de guerra ${nomeGuerra}`,
        usuario_responsavel: body.usuarioResponsavel || req.headers['x-usuario'] as string || 'Sistema',
        militar_envolvido: militar.Id,
      });

      return res.status(201).json({
        message: 'Militar registrado com sucesso!',
        militarId: militar.Id
      });

    } catch (error: any) {
      console.error('Erro ao criar militar:', error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Comentário de organização: Busca o perfil completo de um militar pelo ID,
  // retornando todos os dados relacionados para a página de perfil
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Busca o militar com todos os relacionamentos expandidos
      const militar = await nocoRequest(
        `/tables/${TBL_MILITAR}/records/${id}?nested[punicoes][fields]=Id&nested[fatds1][fields]=Id&nested[funcao_efetivo_cia][fields]=Id&nested[funcao_substituto_cia][fields]=Id`
      );

      if (!militar || !militar.Id) {
        return res.status(404).json({ error: 'Militar não encontrado.' });
      }

      // Comentário de organização: Busca dados civis separadamente para garantir campos completos
      let dadosCivil: any = {};
      if (militar.dados_civil) {
        const civilId = typeof militar.dados_civil === 'object' ? militar.dados_civil.Id : militar.dados_civil;
        try {
          dadosCivil = await nocoRequest(`/tables/${TBL_CIVIL}/records/${civilId}`);
        } catch {}
      }

      // Comentário de organização: Busca endereço
      let endereco: any = {};
      if (militar.endereco) {
        const enderecoId = typeof militar.endereco === 'object' ? militar.endereco.Id : militar.endereco;
        try {
          endereco = await nocoRequest(`/tables/${TBL_ENDERECO}/records/${enderecoId}`);
        } catch {}
      }

      // Comentário de organização: Busca formas de contato
      let contato: any = {};
      if (militar.formas_contato) {
        const contatoId = typeof militar.formas_contato === 'object' ? militar.formas_contato.Id : militar.formas_contato;
        try {
          contato = await nocoRequest(`/tables/${TBL_CONTATO}/records/${contatoId}`);
        } catch {}
      }

      // Comentário de organização: Busca redes sociais
      let redesSociais: any = {};
      if (militar.redes_sociai) {
        const redesId = typeof militar.redes_sociai === 'object' ? militar.redes_sociai.Id : militar.redes_sociai;
        try {
          redesSociais = await nocoRequest(`/tables/${TBL_REDES_SOCIAIS}/records/${redesId}`);
        } catch {}
      }

      // Comentário de organização: Busca especialidades militares
      let especialidades: any = {};
      if (militar.especialidades_militar) {
        const espId = typeof militar.especialidades_militar === 'object' ? militar.especialidades_militar.Id : militar.especialidades_militar;
        try {
          especialidades = await nocoRequest(`/tables/${TBL_ESPECIALIDADES_MILITAR}/records/${espId}`);
        } catch {}
      }

      // Comentário de organização: Busca dados de saúde e férias do militar
      let visitasMedicas: any[] = [];
      let baixados: any[] = [];
      let planosFerias: any[] = [];

      let funcoesCia: any[] = [];
      let punicoesRecebidas: any[] = [];
      let fatdParticipados: any[] = [];

      try {
        const punicoesIds = (militar.punicoes || []).map((p: any) => p.Id);
        const fatds1Ids = (militar.fatds1 || []).map((f: any) => f.Id);
        const funcEfetivoIds = (militar.funcao_efetivo_cia || []).map((f: any) => f.Id);
        const funcSubstIds = (militar.funcao_substituto_cia || []).map((f: any) => f.Id);

        const punicoesQuery = punicoesIds.length > 0 ? `/tables/mxdic5ej7eigds1/records?where=(Id,in,${punicoesIds.join(',')})&nested[fatd][fields]=fato_relatado,data_processo_fato,numero_processo` : null;
        const fatdPartQuery = fatds1Ids.length > 0 ? `/tables/mhdr8z1rnvysh6u/records?where=(Id,in,${fatds1Ids.join(',')})` : null;
        const funcEfetivoQuery = funcEfetivoIds.length > 0 ? `/tables/m53uey4mkuimti7/records?where=(Id,in,${funcEfetivoIds.join(',')})` : null;
        const funcSubstQuery = funcSubstIds.length > 0 ? `/tables/m53uey4mkuimti7/records?where=(Id,in,${funcSubstIds.join(',')})` : null;

        const [
          visitasRes, baixadosRes, feriasRes,
          funcoesEfetivoRes, funcoesSubstitutoRes,
          punicoesRes, fatdPartRes
        ] = await Promise.allSettled([
          nocoRequest(`/tables/m0ya166asp9wk5b/records?where=(militar,eq,${id})`),
          nocoRequest(`/tables/mjaepbsec6qieim/records?where=(militar,eq,${id})`),
          nocoRequest(`/tables/merte6jebbddnb1/records?where=(militar,eq,${id})&nested[periodos_ferias][fields]=nome_periodo,data_inicio,data_fim`),
          funcEfetivoQuery ? nocoRequest(funcEfetivoQuery) : Promise.resolve({ list: [] }),
          funcSubstQuery ? nocoRequest(funcSubstQuery) : Promise.resolve({ list: [] }),
          punicoesQuery ? nocoRequest(punicoesQuery) : Promise.resolve({ list: [] }),
          fatdPartQuery ? nocoRequest(fatdPartQuery) : Promise.resolve({ list: [] })
        ]);

        if (visitasRes.status === 'fulfilled' && visitasRes.value?.list) {
          visitasMedicas = visitasRes.value.list;
        }
        if (baixadosRes.status === 'fulfilled' && baixadosRes.value?.list) {
          baixados = baixadosRes.value.list;
        }
        if (feriasRes.status === 'fulfilled' && feriasRes.value?.list) {
          planosFerias = feriasRes.value.list;
        }
        if (funcoesEfetivoRes.status === 'fulfilled' && funcoesEfetivoRes.value?.list) {
          funcoesCia.push(...funcoesEfetivoRes.value.list.map((f: any) => ({ ...f, vinculo: 'Efetivo' })));
        }
        if (funcoesSubstitutoRes.status === 'fulfilled' && funcoesSubstitutoRes.value?.list) {
          // Evita duplicidade se o NocoDB retornar o mesmo por algum motivo
          const existentes = new Set(funcoesCia.map(f => f.Id));
          funcoesSubstitutoRes.value.list.forEach((f: any) => {
            if (!existentes.has(f.Id)) {
              funcoesCia.push({ ...f, vinculo: 'Substituto' });
            }
          });
        }
        if (punicoesRes.status === 'fulfilled' && punicoesRes.value?.list) {
          punicoesRecebidas = punicoesRes.value.list;
        }
        if (fatdPartRes.status === 'fulfilled' && fatdPartRes.value?.list) {
          fatdParticipados = fatdPartRes.value.list;
        }
      } catch (err) {
        console.warn('Aviso: falha ao buscar registros adicionais:', err);
      }

      // Formata o retorno consolidado para o frontend
      const perfil = {
        id: militar.Id,
        // Dados militares
        nomeGuerra: militar.nome_guerra || '',
        postoGraduacao: militar.posto_graduacao || '',
        idtMilitar: militar.idt_militar || '',
        // Comentário de organização: Mapeamento de precCP no getById
        precCP: militar.prec_cp || '',
        numeroCampoBasico: militar.numero_campo_basico || '',
        numeroEbca: militar.numero_ebca || '',
        dataPraca: militar.data_praca || '',
        turmaFormacao: militar.turma_formacao || '',
        tipoVinculo: militar.tipo_vinculo || '',
        situacao: militar.situacao || '',
        periodoObrigatorio: militar.periodo_obrigatorio || '',
        pelotao: militar.pelotao || '',
        companhia: militar.companhia?.Companhia || '',
        // Dados civis
        dadosCivil: {
          id: dadosCivil.Id,
          nomeCompleto: dadosCivil.nome_completo || '',
          dataNascimento: dadosCivil.data_nascimento || '',
          // Comentário de organização: Retornando sexo e estado_civil do banco de dados
          sexo: dadosCivil.sexo || '',
          estadoCivil: dadosCivil.estado_civil || '',
          cpf: dadosCivil.cpf || '',
          idtCivil: dadosCivil.idt_civil || '',
          altura: dadosCivil.altura || '',
          tipoSanguineo: dadosCivil.tipo_sanquineo || '',
          fatorRh: dadosCivil.fator_rh || '',
          cutis: dadosCivil.cutis || '',
          olhos: dadosCivil.olhos || '',
          cabelos: dadosCivil.cabelos || '',
          religiao: dadosCivil.religiao || '',
          nomeMae: dadosCivil.nome_mae || '',
          nomePai: dadosCivil.nome_pai || '',
          escolaridade: dadosCivil.escolaridade || '',
          cnhCategoria: typeof dadosCivil.cnh_categoria === 'string'
            ? dadosCivil.cnh_categoria.split(',').map((s: string) => s.trim())
            : (Array.isArray(dadosCivil.cnh_categoria) ? dadosCivil.cnh_categoria : []),
          fotoUrl: Array.isArray(dadosCivil.foto_url) && dadosCivil.foto_url.length > 0
            ? dadosCivil.foto_url[0].url || dadosCivil.foto_url[0].signedUrl || ''
            : (typeof dadosCivil.foto_url === 'string' && dadosCivil.foto_url.startsWith('[')
                ? (() => {
                    try {
                      const parsed = JSON.parse(dadosCivil.foto_url);
                      return parsed[0]?.url || parsed[0]?.signedUrl || '';
                    } catch { return dadosCivil.foto_url; }
                  })()
                : dadosCivil.foto_url || '')
        },
        // Endereço
        endereco: {
          cep: endereco.cep || '',
          rua: endereco.rua || '',
          numero: endereco.numero || '',
          complemento: endereco.complemento || '',
          bairro: endereco.bairro || '',
          cidade: endereco.cidade || '',
          uf: endereco.uf || ''
        },
        // Contato
        contato: {
          telefone: contato.telefone || '',
          coabitacao: contato.coabitacao || '',
          telefoneEmergencia: contato.telefone_emergencia || '',
          nomeEmergencia: contato.nome_emergencia || '',
          grauParentesco: contato.grau_parentesco_emergencia || ''
        },
        // Redes sociais
        redesSociais: {
          instagram: redesSociais.instagram || '',
          facebook: redesSociais.facebook || '',
          tiktok: redesSociais.tiktok || '',
          twitter: redesSociais.twitter || '',
          outras: redesSociais.outras_redes || ''
        },
        // Especialidades
        especialidades: {
          cursos: especialidades.cursos_gerais || ''
        },
        // Saúde e Férias
        visitasMedicas: visitasMedicas.map(v => ({
          id: v.Id,
          data: v.data_visita || '',
          motivo: v.motivo_visita || '',
          medico: v.medico_responsavel || '',
          resultado: v.parecer_medico || '',
          baixado: v.baixado === 'Sim',
          obs: v.obs || ''
        })),
        baixados: baixados.map(b => ({
          id: b.Id,
          dataInicio: b.data_inicio || '',
          dataFim: b.data_retorno || '',
          motivo: b.motivo || '',
          csd: b.csd || b.outro_csd || '',
        })),
        planosFerias: planosFerias.map(pf => ({
          id: pf.Id,
          titulo: pf.titulo || '',
          anoReferencia: pf.ano_referencia || '',
          status: pf.status || '',
          periodos: (pf.periodos_ferias || []).map((p: any) => ({
            id: p.Id,
            nome: p.nome_periodo || '',
            inicio: p.data_inicio || '',
            fim: p.data_fim || ''
          }))
        })),
        // Funções da Cia
        funcoesCia: funcoesCia.map(f => ({
          id: f.Id,
          funcao: f.funcao || '',
          ativa: f.ativa ?? true,
          vinculo: f.vinculo || 'Efetivo'
        })),
        // Punições / Ocorrências
        punicoesRecebidas: punicoesRecebidas.map(p => ({
          id: p.Id,
          biPublicacao: p.bi_publicacao || '',
          tipo: p.tipo || '',
          dias: p.dias || 0,
          fatoRelatado: p.fatd?.fato_relatado || '',
          dataFato: p.fatd?.data_processo_fato || '',
          numeroProcesso: p.fatd?.numero_processo || ''
        })),
        fatdParticipados: fatdParticipados.map(f => ({
          id: f.Id,
          numeroProcesso: f.numero_processo || '',
          dataFato: f.data_processo_fato || '',
          fatoRelatado: f.fato_relatado || '',
          funcaoParticipante: f.funcao_participante || ''
        }))
      };

      return res.status(200).json(perfil);
    } catch (error: any) {
      console.error('Erro ao buscar perfil do militar:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Comentário de organização: Exclui um militar e todos os registros relacionados em cascata
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const militarId = parseInt(id as string);

      if (isNaN(militarId)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      // Busca o militar para obter os IDs dos registros relacionados
      const militar = await nocoRequest(`/tables/${TBL_MILITAR}/records/${militarId}`);

      if (!militar || !militar.Id) {
        return res.status(404).json({ error: 'Militar não encontrado.' });
      }

      const dadosCivilId = typeof militar.dados_civil === 'object' ? militar.dados_civil?.Id : militar.dados_civil;
      const enderecoId   = typeof militar.endereco === 'object'    ? militar.endereco?.Id    : militar.endereco;
      const contatoId    = typeof militar.formas_contato === 'object' ? militar.formas_contato?.Id : militar.formas_contato;
      const redesId      = typeof militar.redes_sociai === 'object' ? militar.redes_sociai?.Id : militar.redes_sociai;
      const espId        = typeof militar.especialidades_militar === 'object' ? militar.especialidades_militar?.Id : militar.especialidades_militar;

      // 1. Deleta o registro principal do militar
      await nocoRequest(`/tables/${TBL_MILITAR}/records`, {
        method: 'DELETE',
        body: JSON.stringify([{ Id: militarId }])
      });

      // 2. Deleta registros relacionados em paralelo (ignora erros individuais)
      await Promise.allSettled([
        dadosCivilId ? nocoRequest(`/tables/${TBL_CIVIL}/records`,    { method: 'DELETE', body: JSON.stringify([{ Id: dadosCivilId }]) }) : Promise.resolve(),
        enderecoId   ? nocoRequest(`/tables/${TBL_ENDERECO}/records`, { method: 'DELETE', body: JSON.stringify([{ Id: enderecoId }]) })   : Promise.resolve(),
        contatoId    ? nocoRequest(`/tables/${TBL_CONTATO}/records`,  { method: 'DELETE', body: JSON.stringify([{ Id: contatoId }]) })    : Promise.resolve(),
        redesId      ? nocoRequest(`/tables/${TBL_REDES_SOCIAIS}/records`,          { method: 'DELETE', body: JSON.stringify([{ Id: redesId }]) })   : Promise.resolve(),
        espId        ? nocoRequest(`/tables/${TBL_ESPECIALIDADES_MILITAR}/records`, { method: 'DELETE', body: JSON.stringify([{ Id: espId }]) })     : Promise.resolve(),
      ]);

      // Comentário de organização: Registra log de exclusão no historico_logs
      const nomeGuerraExcluido = militar.nome_guerra || `ID ${militarId}`;
      const usuarioLogado = (req as any).user?.email || (req as any).user?.id || req.headers['x-usuario'] as string || 'Sistema';

      await registrarLog({
        tipo_alteracao: 'Exclusão',
        campo_alteracao: 'Cadastro completo',
        valor_anterior: `Militar ${nomeGuerraExcluido} (${militar.posto_graduacao || ''})`,
        valor_novo: '',
        usuario_responsavel: usuarioLogado,
        militar_envolvido: militarId,
      });

      return res.status(200).json({ message: 'Militar excluído com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao excluir militar:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Comentário de organização: Atualiza todos os dados do militar e seus registros relacionados
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const militarId = parseInt(id as string);

      if (isNaN(militarId)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const body = req.body;

      // Comentário de organização: Busca dados anteriores para gerar o log com valores exatos antes e depois
      const militarAntes = await nocoRequest(`/tables/${TBL_MILITAR}/records/${militarId}`);
      const civilIdAntes = typeof militarAntes.dados_civil === 'object' ? militarAntes.dados_civil?.Id : militarAntes.dados_civil;
      let civilAntes: any = {};
      if (civilIdAntes) {
        try {
          civilAntes = await nocoRequest(`/tables/${TBL_CIVIL}/records/${civilIdAntes}`);
        } catch {}
      }

      const enderecoIdAntes = typeof militarAntes.endereco === 'object' ? militarAntes.endereco?.Id : militarAntes.endereco;
      let enderecoAntes: any = {};
      if (enderecoIdAntes) {
        try {
          enderecoAntes = await nocoRequest(`/tables/${TBL_ENDERECO}/records/${enderecoIdAntes}`);
        } catch {}
      }

      const contatoIdAntes = typeof militarAntes.formas_contato === 'object' ? militarAntes.formas_contato?.Id : militarAntes.formas_contato;
      let contatoAntes: any = {};
      if (contatoIdAntes) {
        try {
          contatoAntes = await nocoRequest(`/tables/${TBL_CONTATO}/records/${contatoIdAntes}`);
        } catch {}
      }

      const redesIdAntes = typeof militarAntes.redes_sociai === 'object' ? militarAntes.redes_sociai?.Id : militarAntes.redes_sociai;
      let redesAntes: any = {};
      if (redesIdAntes) {
        try {
          redesAntes = await nocoRequest(`/tables/${TBL_REDES_SOCIAIS}/records/${redesIdAntes}`);
        } catch {}
      }

      const espIdAntes = typeof militarAntes.especialidades_militar === 'object' ? militarAntes.especialidades_militar?.Id : militarAntes.especialidades_militar;
      let espAntes: any = {};
      if (espIdAntes) {
        try {
          espAntes = await nocoRequest(`/tables/${TBL_ESPECIALIDADES_MILITAR}/records/${espIdAntes}`);
        } catch {}
      }

      // ── 1. Atualiza tabela principal: militares ───────────────────────────
      const militarUpdate: Record<string, any> = { Id: militarId };

      if (body.nomeGuerra !== undefined)        militarUpdate.nome_guerra          = toTitleCase(body.nomeGuerra || '');
      if (body.idtMil !== undefined)            militarUpdate.idt_militar          = body.idtMil || null;
      if (body.postoGraduacao !== undefined)    militarUpdate.posto_graduacao      = mapPostoGraduacao(body.postoGraduacao) || body.postoGraduacao;
      if (body.pelotao !== undefined)           militarUpdate.pelotao              = body.pelotao || null;
      if (body.situacao !== undefined)          militarUpdate.situacao             = body.situacao || null;
      if (body.periodoObrigatorio !== undefined) militarUpdate.periodo_obrigatorio = body.periodoObrigatorio || null;
      if (body.dataPraca !== undefined)         militarUpdate.data_praca           = body.dataPraca || null;
      if (body.turmaFormacao !== undefined)     militarUpdate.turma_formacao       = body.turmaFormacao ? parseInt(body.turmaFormacao) : null;
      if (body.numeroCampoBasico !== undefined) militarUpdate.numero_campo_basico  = body.numeroCampoBasico ? parseInt(body.numeroCampoBasico) : null;
      if (body.numeroEbca !== undefined)        militarUpdate.numero_ebca          = body.numeroEbca ? parseInt(body.numeroEbca) : null;
      if (body.precCP !== undefined)            militarUpdate.prec_cp              = body.precCP || null;

      if (body.tipoMilitar !== undefined) {
        let tv = body.tipoMilitar;
        if (tv === 'temporario' || tv === 'Militar Temporário') tv = 'Militar Temporário';
        else if (tv === 'carreira' || tv === 'Militar de Carreira') tv = 'Militar de Carreira';
        militarUpdate.tipo_vinculo = tv;
      } else if (body.tipoVinculo !== undefined) {
        let tv = body.tipoVinculo;
        if (tv === 'temporario') tv = 'Militar Temporário';
        if (tv === 'carreira')   tv = 'Militar de Carreira';
        militarUpdate.tipo_vinculo = tv;
      }

      if (body.secaoCompanhia !== undefined || body.companhia !== undefined) {
        const compRaw = body.secaoCompanhia || body.companhia;
        const compId = parseInt(compRaw);
        militarUpdate.companhia = isNaN(compId) ? mapCompanhiaId(compRaw) : compId;
      }

      await nocoRequest(`/tables/${TBL_MILITAR}/records`, {
        method: 'PATCH',
        body: JSON.stringify(militarUpdate)
      });

      // Busca o militar para obter IDs relacionados atuais
      const militarRow = await nocoRequest(`/tables/${TBL_MILITAR}/records/${militarId}`);

      // ── 2. Atualiza dados_civil ───────────────────────────────────────────
      const civilId = typeof militarRow.dados_civil === 'object' ? militarRow.dados_civil?.Id : militarRow.dados_civil;
      if (civilId) {
        // Tratamento de altura
        let alturaNum: number | null = null;
        if (body.altura !== undefined && body.altura !== null && body.altura !== '') {
          const alturaStr = String(body.altura).replace(',', '.');
          alturaNum = parseFloat(alturaStr);
          if (isNaN(alturaNum)) alturaNum = null;
        }

        // Tratamento de CNH
        let cnhValue: string[] | string | null = null;
        if (body.cnhCategoria !== undefined) {
          cnhValue = Array.isArray(body.cnhCategoria) ? body.cnhCategoria.join(', ') : body.cnhCategoria;
          if (typeof cnhValue === 'string' && cnhValue.length === 0) cnhValue = null;
        }

        const civilUpdate: Record<string, any> = { Id: civilId };
        if (body.nomeCompleto  !== undefined) civilUpdate.nome_completo       = toTitleCase(body.nomeCompleto);
        if (body.nomeMae       !== undefined) civilUpdate.nome_mae            = toTitleCase(body.nomeMae);
        if (body.nomePai       !== undefined) civilUpdate.nome_pai            = toTitleCase(body.nomePai);
        if (body.dataNascimento !== undefined) civilUpdate.data_nascimento    = body.dataNascimento || null;
        if (body.sexo           !== undefined) civilUpdate.sexo               = body.sexo || null;
        // Comentário de organização: Atualiza estado_civil na tabela dados_civil
        if (body.estadoCivil    !== undefined) civilUpdate.estado_civil       = body.estadoCivil || null;
        if (body.cpf           !== undefined) civilUpdate.cpf                 = body.cpf || null;
        if (body.idtCivil      !== undefined) civilUpdate.idt_civil           = body.idtCivil || null;
        if (body.altura        !== undefined) civilUpdate.altura              = alturaNum;
        if (body.tipoSanguineo !== undefined) civilUpdate.tipo_sanquineo      = mapTipoSanguineo(body.tipoSanguineo);
        if (body.fatorRh       !== undefined) civilUpdate.fator_rh            = mapFatorRh(body.fatorRh);
        if (body.cutis         !== undefined) civilUpdate.cutis               = mapCutis(body.cutis);
        if (body.olhos         !== undefined) civilUpdate.olhos               = mapOlhos(body.olhos);
        if (body.cabelos       !== undefined) civilUpdate.cabelos             = mapCabelos(body.cabelos);
        if (body.religiao      !== undefined) civilUpdate.religiao            = body.religiao || null;
        if (body.escolaridade  !== undefined) civilUpdate.escolaridade        = mapEscolaridade(body.escolaridade) || body.escolaridade || null;
        if (body.cnhCategoria  !== undefined) civilUpdate.cnh_categoria       = cnhValue;
        if (body.fotoUrl       !== undefined) civilUpdate.foto_url            = body.fotoUrl;

        await nocoRequest(`/tables/${TBL_CIVIL}/records`, {
          method: 'PATCH',
          body: JSON.stringify(civilUpdate)
        });
      }

      // ── 3. Atualiza endereço ──────────────────────────────────────────────
      const enderecoId = typeof militarRow.endereco === 'object' ? militarRow.endereco?.Id : militarRow.endereco;
      if (enderecoId && (body.cep !== undefined || body.rua !== undefined || body.bairro !== undefined || body.cidade !== undefined || body.uf !== undefined || body.numeroResidencial !== undefined || body.complemento !== undefined)) {
        const enderecoUpdate: Record<string, any> = { Id: enderecoId };
        if (body.cep               !== undefined) enderecoUpdate.cep         = body.cep || '';
        if (body.rua               !== undefined) enderecoUpdate.rua         = toTitleCase(body.rua || '');
        if (body.numeroResidencial !== undefined) enderecoUpdate.numero      = body.numeroResidencial || '';
        if (body.complemento       !== undefined) enderecoUpdate.complemento = body.complemento || '';
        if (body.bairro            !== undefined) enderecoUpdate.bairro      = toTitleCase(body.bairro || '');
        if (body.cidade            !== undefined) enderecoUpdate.cidade      = toTitleCase(body.cidade || '');
        if (body.uf                !== undefined) enderecoUpdate.uf          = (body.uf || '').toUpperCase();

        await nocoRequest(`/tables/${TBL_ENDERECO}/records`, {
          method: 'PATCH',
          body: JSON.stringify(enderecoUpdate)
        });
      }

      // ── 4. Atualiza formas_contato ────────────────────────────────────────
      const contatoId = typeof militarRow.formas_contato === 'object' ? militarRow.formas_contato?.Id : militarRow.formas_contato;
      if (contatoId && (body.telefoneCelular !== undefined || body.resideCom !== undefined || body.telefoneEmergencia !== undefined || body.nomeEmergencia !== undefined || body.grauParentesco !== undefined)) {
        const contatoUpdate: Record<string, any> = { Id: contatoId };
        if (body.telefoneCelular    !== undefined) contatoUpdate.telefone                    = body.telefoneCelular || '';
        if (body.resideCom          !== undefined) contatoUpdate.coabitacao                 = Array.isArray(body.resideCom) ? body.resideCom.join(', ') : body.resideCom || '';
        if (body.telefoneEmergencia !== undefined) contatoUpdate.telefone_emergencia         = body.telefoneEmergencia || '';
        if (body.nomeEmergencia     !== undefined) contatoUpdate.nome_emergencia             = toTitleCase(body.nomeEmergencia || '');
        if (body.grauParentesco     !== undefined) contatoUpdate.grau_parentesco_emergencia  = body.grauParentesco || '';

        await nocoRequest(`/tables/${TBL_CONTATO}/records`, {
          method: 'PATCH',
          body: JSON.stringify(contatoUpdate)
        });
      }

      // ── 5. Atualiza redes_sociais ─────────────────────────────────────────
      const redesId = typeof militarRow.redes_sociai === 'object' ? militarRow.redes_sociai?.Id : militarRow.redes_sociai;
      if (redesId && (body.instagram !== undefined || body.facebook !== undefined || body.tiktok !== undefined || body.twitter !== undefined || body.outrasRedes !== undefined)) {
        const redesUpdate: Record<string, any> = { Id: redesId };
        if (body.instagram   !== undefined) redesUpdate.instagram    = body.instagram || '';
        if (body.facebook    !== undefined) redesUpdate.facebook     = body.facebook || '';
        if (body.tiktok      !== undefined) redesUpdate.tiktok       = body.tiktok || '';
        if (body.twitter     !== undefined) redesUpdate.twitter      = body.twitter || '';
        if (body.outrasRedes !== undefined) redesUpdate.outras_redes = body.outrasRedes || '';

        await nocoRequest(`/tables/${TBL_REDES_SOCIAIS}/records`, {
          method: 'PATCH',
          body: JSON.stringify(redesUpdate)
        });
      }

      // ── 6. Atualiza especialidades_militar ────────────────────────────────
      const espId = typeof militarRow.especialidades_militar === 'object' ? militarRow.especialidades_militar?.Id : militarRow.especialidades_militar;
      if (espId && body.cursosProfissionais !== undefined) {
        await nocoRequest(`/tables/${TBL_ESPECIALIDADES_MILITAR}/records`, {
          method: 'PATCH',
          body: JSON.stringify({ Id: espId, cursos_gerais: body.cursosProfissionais || '' })
        });
      }

      // Comentário de organização: Registra log de atualização no historico_logs
      // Monta descrição legível dos campos que foram modificados e seus valores de/para
      const nomeGuerraAtual = militarRow.nome_guerra || `ID ${militarId}`;
      const camposAlterados: string[] = [];
      const valoresAnteriores: string[] = [];
      const valoresNovos: string[] = [];

      const mapLabels: Record<string, { label: string; getOld: () => any; getNew: () => any }> = {
        nomeGuerra: { label: 'Nome de Guerra', getOld: () => militarAntes.nome_guerra, getNew: () => toTitleCase(body.nomeGuerra || '') || null },
        postoGraduacao: { label: 'Posto/Graduação', getOld: () => militarAntes.posto_graduacao, getNew: () => mapPostoGraduacao(body.postoGraduacao) || null },
        situacao: { label: 'Situação', getOld: () => militarAntes.situacao, getNew: () => body.situacao || null },
        pelotao: { label: 'Pelotão', getOld: () => militarAntes.pelotao, getNew: () => body.pelotao || null },
        tipoMilitar: { label: 'Tipo de Vínculo', getOld: () => militarAntes.tipo_vinculo, getNew: () => body.tipoMilitar || null },
        tipoVinculo: { label: 'Tipo de Vínculo', getOld: () => militarAntes.tipo_vinculo, getNew: () => body.tipoVinculo || null },
        companhia: { label: 'Companhia', getOld: () => militarAntes.companhia?.Id || militarAntes.companhia, getNew: () => body.companhia || null },
        dataPraca: { label: 'Data de Praça', getOld: () => militarAntes.data_praca, getNew: () => body.dataPraca || null },
        turmaFormacao: { label: 'Turma de Formação', getOld: () => militarAntes.turma_formacao, getNew: () => body.turmaFormacao ? parseInt(body.turmaFormacao) : null },
        precCP: { label: 'Prec-CP', getOld: () => militarAntes.prec_cp, getNew: () => body.precCP || null },
        idtMil: { label: 'Identidade Militar', getOld: () => militarAntes.idt_militar, getNew: () => body.idtMil || body.idtMilitar || null },
        nomeCompleto: { label: 'Nome Completo', getOld: () => civilAntes.nome_completo, getNew: () => toTitleCase(body.nomeCompleto || '') || null },
        nomeMae: { label: 'Nome da Mãe', getOld: () => civilAntes.nome_mae, getNew: () => toTitleCase(body.nomeMae || '') || null },
        nomePai: { label: 'Nome do Pai', getOld: () => civilAntes.nome_pai, getNew: () => toTitleCase(body.nomePai || '') || null },
        dataNascimento: { label: 'Data de Nascimento', getOld: () => civilAntes.data_nascimento, getNew: () => body.dataNascimento || null },
        sexo: { label: 'Sexo', getOld: () => civilAntes.sexo, getNew: () => body.sexo || null },
        // Comentário de organização: Log do campo estado_civil no historico de alterações
        estadoCivil: { label: 'Estado Civil', getOld: () => civilAntes.estado_civil, getNew: () => body.estadoCivil || null },
        cpf: { label: 'CPF', getOld: () => civilAntes.cpf, getNew: () => body.cpf || null },
        idtCivil: { label: 'Identidade Civil', getOld: () => civilAntes.idt_civil, getNew: () => body.idtCivil || null },
        altura: { label: 'Altura', getOld: () => civilAntes.altura, getNew: () => typeof body.altura === 'string' ? parseFloat(body.altura.replace(',', '.')) : (body.altura || null) },
        tipoSanguineo: { label: 'Tipo Sanguíneo', getOld: () => civilAntes.tipo_sanquineo, getNew: () => mapTipoSanguineo(body.tipoSanguineo) || null },
        fatorRh: { label: 'Fator RH', getOld: () => civilAntes.fator_rh, getNew: () => mapFatorRh(body.fatorRh) || null },
        cutis: { label: 'Cutis', getOld: () => civilAntes.cutis, getNew: () => mapCutis(body.cutis) || null },
        olhos: { label: 'Olhos', getOld: () => civilAntes.olhos, getNew: () => mapOlhos(body.olhos) || null },
        cabelos: { label: 'Cabelos', getOld: () => civilAntes.cabelos, getNew: () => mapCabelos(body.cabelos) || null },
        religiao: { label: 'Religião', getOld: () => civilAntes.religiao, getNew: () => body.religiao || null },
        escolaridade: { label: 'Escolaridade', getOld: () => civilAntes.escolaridade, getNew: () => mapEscolaridade(body.escolaridade) || body.escolaridade || null },
        cnhCategoria: { label: 'CNH', getOld: () => civilAntes.cnh_categoria, getNew: () => Array.isArray(body.cnhCategoria) ? body.cnhCategoria.join(', ') : (body.cnhCategoria || null) },
        fotoUrl: { label: 'Foto de Perfil', getOld: () => 'Foto anterior', getNew: () => 'Nova foto enviada' },
        cep: { label: 'CEP', getOld: () => enderecoAntes.cep, getNew: () => body.cep },
        rua: { label: 'Logradouro', getOld: () => enderecoAntes.rua, getNew: () => body.rua },
        bairro: { label: 'Bairro', getOld: () => enderecoAntes.bairro, getNew: () => body.bairro },
        cidade: { label: 'Cidade', getOld: () => enderecoAntes.cidade, getNew: () => body.cidade },
        uf: { label: 'UF', getOld: () => enderecoAntes.uf, getNew: () => body.uf },
        telefoneCelular: { label: 'Telefone', getOld: () => contatoAntes.telefone, getNew: () => body.telefoneCelular },
        resideCom: { label: 'Reside Com', getOld: () => contatoAntes.coabitacao, getNew: () => Array.isArray(body.resideCom) ? body.resideCom.join(', ') : body.resideCom },
        nomeEmergencia: { label: 'Contato de Emergência', getOld: () => contatoAntes.nome_emergencia, getNew: () => body.nomeEmergencia },
        instagram: { label: 'Instagram', getOld: () => redesAntes.instagram, getNew: () => body.instagram },
        cursosProfissionais: { label: 'Cursos', getOld: () => espAntes.cursos_gerais, getNew: () => body.cursosProfissionais },
      };

      Object.keys(body).forEach(k => {
        if (mapLabels[k] && body[k] !== undefined) {
          const cfg = mapLabels[k];
          let oldVal = cfg.getOld() ?? '—';
          let newVal = cfg.getNew() ?? '—';

          // Se a string contiver vazio puro, tratar como '—' também para a comparação
          oldVal = String(oldVal).trim() === '' ? '—' : String(oldVal).trim();
          newVal = String(newVal).trim() === '' ? '—' : String(newVal).trim();

          if (oldVal !== newVal) {
            camposAlterados.push(cfg.label);
            valoresAnteriores.push(`${cfg.label}: ${oldVal}`);
            valoresNovos.push(`${cfg.label}: ${newVal}`);
          }
        }
      });

      if (camposAlterados.length > 0) {
        await registrarLog({
          tipo_alteracao: 'Atualização',
          campo_alteracao: camposAlterados.join(', '),
          valor_anterior: valoresAnteriores.join(' | '),
          valor_novo: valoresNovos.join(' | '),
          usuario_responsavel: body.usuarioResponsavelId || (req as any).user?.id || req.headers['x-usuario'] as string,
          militar_envolvido: militarId,
        });
      }

      return res.status(200).json({ message: 'Militar atualizado com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao atualizar militar:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

