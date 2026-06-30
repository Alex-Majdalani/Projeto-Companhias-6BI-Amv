import 'dotenv/config'; // Carrega as variáveis de ambiente do arquivo .env no escopo global
import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { uploadRoutes } from './routes/upload.routes';
import { militarRoutes } from './routes/militar.routes';
import { agendaRoutes } from './routes/agenda.routes';
import { feriasRoutes } from './routes/ferias.routes';
import { funcaoRoutes } from './routes/funcao.routes';
import { fatdRoutes } from './routes/fatd.routes';
import { atendimentoRoutes } from './routes/atendimento.routes';
import { tafRoutes } from './routes/taf.routes';
import { tiroRoutes } from './routes/tiro.routes';
import { historicoRoutes } from './routes/historico.routes';

const app = express();

app.use(cors()); // Habilita o compartilhamento de recursos de origem cruzada para permitir chamadas do frontend (rodando em outra porta)
app.use(express.json()); // Configura o parser de JSON para que o express processe requisições com corpo JSON

// Define o prefixo '/api' e vincula os endpoints de autenticação
app.use('/api/auth', authRoutes);
app.use('/api/militares', militarRoutes);

// Define o prefixo '/api/fatd' e vincula as rotas de FATD
app.use('/api/fatd', fatdRoutes);

// Vincula o endpoint de upload para o MinIO
app.use('/api/upload', uploadRoutes);

// Define o prefixo '/api/agenda' e vincula os endpoints de agenda de atividades
app.use('/api/agenda', agendaRoutes);

// Define o prefixo '/api/ferias' e vincula as rotas para o módulo de plano/período de férias
app.use('/api/ferias', feriasRoutes);

// Define o prefixo '/api/funcoes' e vincula as rotas de funções da cia
app.use('/api/funcoes', funcaoRoutes);

// Define o prefixo '/api/atendimentos' e vincula as rotas de atendimentos
app.use('/api/atendimentos', atendimentoRoutes);

// Define o prefixo '/api/taf' e vincula as rotas de TAF
app.use('/api/taf', tafRoutes);

// Define o prefixo '/api/tiro' e vincula as rotas de Tiro
app.use('/api/tiro', tiroRoutes);

// Comentário de organização: Define o prefixo '/api/historico' para o módulo de histórico de alterações
app.use('/api/historico', historicoRoutes);

// Define a porta do servidor, priorizando a variável de ambiente PORT ou caindo na 3333 por padrão
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
