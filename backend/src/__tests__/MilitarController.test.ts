import request from 'supertest';
import express from 'express';
import { MilitarController } from '../controllers/MilitarController';
import axios from 'axios';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do axios para evitar requisições reais à API do NocoDB
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = express();
app.use(express.json());

// Configuramos as rotas que queremos testar
app.post('/api/militares', MilitarController.create);
app.patch('/api/militares/:id', MilitarController.update);
app.get('/api/militares/:id', MilitarController.getById);

describe('MilitarController - Dados Civis (estado_civil e sexo)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve incluir estado_civil e sexo no payload de criação do militar', async () => {
    // Mock para as 6 tabelas que são chamadas no create
    mockedAxios.post.mockResolvedValueOnce({ data: { Id: 1 } }); // TBL_CIVIL
    mockedAxios.post.mockResolvedValueOnce({ data: { Id: 1 } }); // TBL_ENDERECO
    mockedAxios.post.mockResolvedValueOnce({ data: { Id: 1 } }); // TBL_CONTATO
    mockedAxios.post.mockResolvedValueOnce({ data: { Id: 1 } }); // TBL_REDES_SOCIAIS
    mockedAxios.post.mockResolvedValueOnce({ data: { Id: 1 } }); // TBL_ESPECIALIDADES
    mockedAxios.post.mockResolvedValueOnce({ data: { Id: 1 } }); // TBL_MILITAR

    const payload = {
      nome: 'João Silva',
      estadoCivil: 'Solteiro(a)',
      sexo: 'Masculino'
    };

    const response = await request(app).post('/api/militares').send(payload);

    expect(response.status).toBe(201);
    
    // O primeiro POST do create é na TBL_CIVIL. Vamos pegar os argumentos passados.
    const civilPostArgs = mockedAxios.post.mock.calls[0];
    expect(civilPostArgs![0]).toContain('TBL_CIVIL');
    
    const civilPayload = civilPostArgs![1] as any;
    expect(civilPayload.estado_civil).toBe('Solteiro(a)');
    expect(civilPayload.sexo).toBe('Masculino');
  });

  it('deve incluir estado_civil e sexo no payload de atualização do militar', async () => {
    // Mock do get para pegar os dados antigos e do patch para atualizar
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        Id: 1,
        civil_id: { Id: 10, estado_civil: 'Solteiro(a)', sexo: 'Masculino' }
      }
    });
    mockedAxios.patch.mockResolvedValue({ data: { success: true } });
    mockedAxios.post.mockResolvedValue({ data: { success: true } }); // log

    const payload = {
      estadoCivil: 'Casado(a)',
      sexo: 'Masculino'
    };

    const response = await request(app).patch('/api/militares/1').send(payload);

    expect(response.status).toBe(200);

    // Encontra o PATCH na TBL_CIVIL
    const patchCalls = mockedAxios.patch.mock.calls;
    const civilPatchCall = patchCalls.find(call => call[0].includes('TBL_CIVIL'));
    
    expect(civilPatchCall).toBeDefined();
    if (civilPatchCall) {
      const civilPayload = civilPatchCall[1] as any;
      expect(civilPayload.estado_civil).toBe('Casado(a)');
      expect(civilPayload.sexo).toBe('Masculino');
    }
  });

  it('deve retornar estado_civil e sexo na busca por id', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        Id: 1,
        civil_id: { Id: 10, estado_civil: 'Divorciado(a)', sexo: 'Feminino' },
        endereco_id: { Id: 10 },
        contato_id: { Id: 10 },
        redes_sociais_id: { Id: 10 },
        especialidades_id: { Id: 10 }
      }
    });

    const response = await request(app).get('/api/militares/1');

    expect(response.status).toBe(200);
    expect(response.body.dadosCivil.estadoCivil).toBe('Divorciado(a)');
    expect(response.body.dadosCivil.sexo).toBe('Feminino');
  });
});
