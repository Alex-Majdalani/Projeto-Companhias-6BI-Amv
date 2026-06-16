import { Router } from 'express';
import multer from 'multer';
import { FATDController } from '../controllers/FATDController';

const fatdRoutes = Router();

// Configuração do Multer em memória específica para arquivos PDF
const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB para arquivos de documento
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype === 'application/pdf') {
      callback(null, true);
    } else {
      callback(new Error('Formato de arquivo inválido. Apenas PDFs são permitidos!'));
    }
  }
});

fatdRoutes.get('/verify', FATDController.verifyProcesso);
fatdRoutes.post('/', uploadPDF.single('pdf'), FATDController.create);

export { fatdRoutes };
