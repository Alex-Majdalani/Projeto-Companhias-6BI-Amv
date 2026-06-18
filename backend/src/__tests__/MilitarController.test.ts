import request from 'supertest';
import express from 'express';
import { MilitarController } from '../controllers/MilitarController';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const app = express();
app.use(express.json());

app.post('/api/militares', MilitarController.create);
app.patch('/api/militares/:id', MilitarController.update);
app.get('/api/militares/:id', MilitarController.getById);
app.delete('/api/militares/:id', MilitarController.delete);

describe('MilitarController - Testes Integrados e Logs', () => {
  let originalFetch: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('deve buscar os dados de saude e ferias no getById', async () => {
    (global.fetch as jest.Mock<any>).mockImplementation(async (url: string) => {
      if (url.includes('m0ya166asp9wk5b')) {
        return { ok: true, json: async () => ({ list: [{ Id: 100, data_visita: '2026-01-01', motivo_visita: 'Rotina', medico_responsavel: 'Dr. Silva', parecer_medico: 'Apto', baixado: 'Não' }] }) };
      }
      if (url.includes('mjaepbsec6qieim') || url.includes('merte6jebbddnb1')) {
        return { ok: true, json: async () => ({ list: [] }) };
      }
      if (url.includes('TBL_CIVIL') || url.includes('msl8p9t3f0q1y4i') || url.includes('/records/10')) { 
        return { ok: true, json: async () => ({ Id: 10, estado_civil: 'Solteiro', sexo: 'Masculino' }) };
      }
      // default: militar
      return {
        ok: true,
        json: async () => ({
          Id: 1,
          dados_civil: { Id: 10 },
          endereco: { Id: 10 },
          formas_contato: { Id: 10 },
          redes_sociai: { Id: 10 },
          especialidades_militar: { Id: 10 }
        })
      };
    });

    const response = await request(app).get('/api/militares/1');

    expect(response.status).toBe(200);
    expect(response.body.dadosCivil.estadoCivil).toBe('Solteiro');
    expect(response.body.visitasMedicas.length).toBeGreaterThanOrEqual(0);
    
    // Verifica se as rotas extras foram chamadas (Férias, Saúde)
    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    const hasVisitas = fetchCalls.some((c: any) => c[0].includes('m0ya166asp9wk5b'));
    const hasBaixados = fetchCalls.some((c: any) => c[0].includes('mjaepbsec6qieim'));
    const hasFerias = fetchCalls.some((c: any) => c[0].includes('merte6jebbddnb1'));
    
    expect(hasVisitas).toBeTruthy();
    expect(hasBaixados).toBeTruthy();
    expect(hasFerias).toBeTruthy();
  });
});
