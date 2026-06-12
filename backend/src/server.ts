import 'dotenv/config'; // Carrega as variáveis de ambiente do arquivo .env no escopo global
import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { agendaRoutes } from './routes/agenda.routes'; // Rotas da agenda de atividades
import { feriasRoutes } from './routes/ferias.routes'; // Comentário de organização: Rotas para o gerenciamento de férias e períodos

const app = express();

app.use(cors()); // Habilita o compartilhamento de recursos de origem cruzada para permitir chamadas do frontend (rodando em outra porta)
app.use(express.json()); // Configura o parser de JSON para que o express processe requisições com corpo JSON

// Define o prefixo '/api' e vincula os endpoints de autenticação
app.use('/api/auth', authRoutes);

// Define o prefixo '/api/agenda' e vincula os endpoints de agenda de atividades
app.use('/api/agenda', agendaRoutes);

// Comentário de organização: Define o prefixo '/api/ferias' e vincula as rotas para o módulo de plano/período de férias
app.use('/api/ferias', feriasRoutes);

// Define a porta do servidor, priorizando a variável de ambiente PORT ou caindo na 3333 por padrão
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
