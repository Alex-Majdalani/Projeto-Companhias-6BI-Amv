import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { militarRoutes } from './routes/militar.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/militares', militarRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
