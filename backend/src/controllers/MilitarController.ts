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
      }});

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
        `/tables/${TBL_MILITAR}/records/${id}`
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
        }
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
      const militarId = parseInt(id);

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

      return res.status(200).json({ message: 'Militar excluído com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao excluir militar:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Comentário de organização: Atualiza dados básicos do militar (nome de guerra, posto, companhia, pelotão, tipo de vínculo)
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const militarId = parseInt(id);

      if (isNaN(militarId)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const body = req.body;

      // Monta objeto de atualização apenas com campos enviados
      const militarUpdate: Record<string, any> = { Id: militarId };

      if (body.nomeGuerra !== undefined)     militarUpdate.nome_guerra      = toTitleCase(body.nomeGuerra || '');
      if (body.postoGraduacao !== undefined) militarUpdate.posto_graduacao  = mapPostoGraduacao(body.postoGraduacao) || body.postoGraduacao;
      if (body.pelotao !== undefined)        militarUpdate.pelotao           = body.pelotao;
      if (body.situacao !== undefined)       militarUpdate.situacao          = body.situacao;
      if (body.tipoVinculo !== undefined) {
        let tv = body.tipoVinculo;
        if (tv === 'temporario')  tv = 'Militar Temporário';
        if (tv === 'carreira')    tv = 'Militar de Carreira';
        militarUpdate.tipo_vinculo = tv;
      }
      if (body.companhia !== undefined) {
        const compId = parseInt(body.companhia);
        militarUpdate.companhia = isNaN(compId) ? mapCompanhiaId(body.companhia) : compId;
      }
      if (body.dataPraca !== undefined)      militarUpdate.data_praca        = body.dataPraca;
      if (body.turmaFormacao !== undefined)  militarUpdate.turma_formacao    = body.turmaFormacao ? parseInt(body.turmaFormacao) : null;
      // Comentário de organização: Atualização dos novos campos prec_cp, numero_campo_basico e numero_ebca no update
      if (body.numeroCampoBasico !== undefined) militarUpdate.numero_campo_basico = body.numeroCampoBasico ? parseInt(body.numeroCampoBasico) : null;
      if (body.numeroEbca !== undefined)        militarUpdate.numero_ebca        = body.numeroEbca ? parseInt(body.numeroEbca) : null;
      if (body.precCP !== undefined)            militarUpdate.prec_cp            = body.precCP || null;

      await nocoRequest(`/tables/${TBL_MILITAR}/records`, {
        method: 'PATCH',
        body: JSON.stringify(militarUpdate)
      });

      // Atualiza dados civis vinculados se enviados
      if (body.nomeCompleto !== undefined || body.nomeMae !== undefined || body.nomePai !== undefined) {
        const militar = await nocoRequest(`/tables/${TBL_MILITAR}/records/${militarId}`);
        const civilId = typeof militar.dados_civil === 'object' ? militar.dados_civil?.Id : militar.dados_civil;
        if (civilId) {
          const civilUpdate: Record<string, any> = { Id: civilId };
          if (body.nomeCompleto !== undefined) civilUpdate.nome_completo = toTitleCase(body.nomeCompleto);
          if (body.nomeMae !== undefined) civilUpdate.nome_mae = toTitleCase(body.nomeMae);
          if (body.nomePai !== undefined) civilUpdate.nome_pai = toTitleCase(body.nomePai);

          await nocoRequest(`/tables/${TBL_CIVIL}/records`, {
            method: 'PATCH',
            body: JSON.stringify(civilUpdate)
          });
        }
      }

      return res.status(200).json({ message: 'Militar atualizado com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao atualizar militar:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
