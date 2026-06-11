import 'dotenv/config'; // Carrega as variáveis de ambiente do arquivo .env no escopo global
import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { uploadRoutes } from './routes/upload.routes';

const app = express();

app.use(cors()); // Habilita o compartilhamento de recursos de origem cruzada para permitir chamadas do frontend (rodando em outra porta)
app.use(express.json()); // Configura o parser de JSON para que o express processe requisições com corpo JSON

// Define o prefixo '/api' e vincula os endpoints de autenticação
app.use('/api/auth', authRoutes);

// Vincula o endpoint de upload para o MinIO
app.use('/api/upload', uploadRoutes);

// Define a porta do servidor, priorizando a variável de ambiente PORT ou caindo na 3333 por padrão
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
