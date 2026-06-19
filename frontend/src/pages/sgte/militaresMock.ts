// ─────────────────────────────────────────────────────────────────────────────
// Comentário de organização: Lista mock de militares usada como fallback em
// páginas que ainda não consomem a API real (Punições, PlanoFerias, FuncoesCia, FATD).
// Mantida aqui para não quebrar esses módulos durante a migração para dados reais.
// ─────────────────────────────────────────────────────────────────────────────
export const militaresMock = [
  { id: 1, posto: 'Maj',     nome: 'JOÃO CARLOS DA SILVA',       identidade: '123456789-0', cpf: '123.456.789-00', quadro: 'QAO',  subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Carreira'   },
  { id: 2, posto: 'Cap',     nome: 'MARIA EDUARDA SOUZA',        identidade: '987654321-1', cpf: '987.654.321-11', quadro: 'QEM',  subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Carreira'   },
  { id: 3, posto: '1º Ten',  nome: 'PEDRO HENRIQUE ALMEIDA',     identidade: '112233445-2', cpf: '112.233.445-22', quadro: 'QAO',  subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Temporário' },
  { id: 4, posto: '2º Sgt',  nome: 'LUCAS DE OLIVEIRA COSTA',    identidade: '223344556-3', cpf: '223.344.556-33', quadro: 'QESA', subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Carreira'   },
  { id: 5, posto: 'Cb',      nome: 'GABRIEL FERREIRA LIMA',      identidade: '334455667-4', cpf: '334.455.667-44', quadro: 'QE',   subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Temporário' },
  { id: 6, posto: 'Sd',      nome: 'MATHEUS ROCHA SANTOS',       identidade: '445566778-5', cpf: '445.566.778-55', quadro: 'QE',   subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Temporário' },
  { id: 7, posto: 'Maj',     nome: 'FERNANDA CRISTINA MOURA',    identidade: '556677889-6', cpf: '556.677.889-66', quadro: 'QAO',  subunidade: '12º BI INF', situacao: 'Licença', tipo: 'Carreira'   },
  { id: 8, posto: '1º Ten',  nome: 'RAFAEL AZEVEDO MARTINS',     identidade: '667788990-7', cpf: '667.788.990-77', quadro: 'QEM',  subunidade: '12º BI INF', situacao: 'Afastado',tipo: 'Temporário' },
  { id: 9, posto: '2º Sgt',  nome: 'THIAGO MENEZES PEREIRA',     identidade: '778899001-8', cpf: '778.899.001-88', quadro: 'QESA', subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Carreira'   },
  { id: 10, posto: 'Cb',     nome: 'BRUNO GOMES RIBEIRO',        identidade: '889900112-9', cpf: '889.900.112-99', quadro: 'QE',   subunidade: '12º BI INF', situacao: 'Ativo',   tipo: 'Temporário' },
];
