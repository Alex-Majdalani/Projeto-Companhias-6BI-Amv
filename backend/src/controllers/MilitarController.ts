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

// Helpers para mapear opções do frontend para o NocoDB
function mapFatorRh(fator: string): string {
  if (fator === '+') return 'Positivo (+)';
  if (fator === '-') return 'Negativo (-)';
  return fator;
}

function mapCutis(cutis: string): string {
  if (!cutis) return 'Branca';
  // Capitalizar primeira letra
  return cutis.charAt(0).toUpperCase() + cutis.slice(1).toLowerCase();
}

function mapOlhos(olhos: string): string {
  if (!olhos) return 'Castanhos';
  return olhos.charAt(0).toUpperCase() + olhos.slice(1).toLowerCase();
}

function mapCabelos(cabelos: string): string {
  if (!cabelos) return 'Preto';
  const val = cabelos.toLowerCase();
  if (val.startsWith('preto')) return 'Preto';
  if (val.startsWith('castanho')) return 'Castanho';
  if (val.startsWith('loiro')) return 'Loiro';
  if (val.startsWith('ruivo')) return 'Ruivo';
  if (val.startsWith('grisalho') || val.startsWith('branco')) return 'Grisalho / Branco';
  return 'Outro';
}

function mapEscolaridade(esc: string): string {
  const map: Record<string, string> = {
    fundamental_inc: 'Fundamental Incompleto',
    fundamental_com: 'Fundamental Completo',
    medio_inc: 'Médio Incompleto',
    medio_com: 'Médio Completo',
    superior_inc: 'Superior Incompleto',
    superior_com: 'Superior Completo'
  };
  return map[esc] || 'Médio Completo';
}

function mapPostoGraduacao(posto: string): string {
  const map: Record<string, string> = {
    cel: 'CEL',
    tc: 'TC',
    maj: 'MAJ',
    cap: 'CAP',
    '1ten': '1º TEN',
    '2ten': '2º TEN',
    asp: 'ASP',
    st: 'ST',
    '1sgt': '1º SGT',
    '2sgt': '2º SGT',
    '3sgt': '3º SGT',
    cb: 'CB',
    sdep: 'SD EP',
    sdev: 'SD EV'
  };
  return map[(posto || '').toLowerCase()] || 'SD EP';
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
      // Lista de militares com relacionamentos resolvidos
      const data = await nocoRequest(`/tables/${TBL_MILITAR}/records?limit=100`);
      
      // Formatar dados para o frontend
      const formatados = (data.list || []).map((m: any) => ({
        id: m.Id,
        posto: m.posto_graduacao || 'SD EP',
        nome: m.dados_civil?.nome_completo || m.nome_guerra || 'Sem Nome',
        nome_completo: m.dados_civil?.nome_completo || '',
        nome_guerra: m.nome_guerra || '',
        identidade: m.idt_militar || '',
        cpf: m.dados_civil?.cpf || '',
        quadro: m.posto_graduacao || '',
        subunidade: m.companhia?.Companhia || '',
        situacao: 'Ativo',
        tipo: m.tipo_vinculo || 'Militar Temporário',
        cursosProfissionais: m.especialidades_militar?.cursos_gerais || ''
      }));

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
      const dadosCivilBody = {
        nome_completo: toTitleCase(body.nomeCompleto || body.nome_completo || ''),
        data_nascimento: body.dataNascimento || null,
        cpf: body.cpf,
        idt_civil: body.idtCivil || null,
        altura: alturaNum,
        tipo_sanquineo: body.tipoSanguineo || 'O',
        fator_rh: mapFatorRh(body.fatorRh || '+'),
        cutis: toTitleCase(body.cutis || 'Branca'),
        olhos: toTitleCase(body.olhos || 'Castanhos'),
        cabelos: toTitleCase(body.cabelos || 'Preto'),
        religiao: body.religiao || '',
        escolaridade: mapEscolaridade(body.escolaridade),
        cnh_categoria: cnhCategorias
      };

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
      const militarBody = {
        nome_guerra: toTitleCase(body.nomeGuerra || ''),
        idt_militar: body.idtMil || body.idtMilitar || '',
        numero_campo_basico: body.numero ? parseInt(body.numero) : null,
        numero_ebca: body.numero ? parseInt(body.numero) : null,
        data_praca: body.dataPraca || null,
        turma_formacao: body.turmaFormacao ? parseInt(body.turmaFormacao) : null,
        dados_civil: civil.Id,
        endereco: endereco.Id,
        formas_contato: contato.Id,
        redes_sociai: redesSociais.Id,
        especialidades_militar: especialidadesMilitar.Id,
        posto_graduacao: mapPostoGraduacao(body.postoGraduacao || 'sdep'),
        companhia: companhiaId,
        tipo_vinculo: tipoVinculo,
        pelotao: body.pelotao || null
      };

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
}
