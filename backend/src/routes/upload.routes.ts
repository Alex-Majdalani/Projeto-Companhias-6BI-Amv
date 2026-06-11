import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import { uploadToS3 } from '../services/s3Service';

const uploadRoutes = Router();

/**
 * Rota POST /api/upload
 * Intercepta o arquivo de imagem no campo 'foto' e faz o upload para o MinIO/S3.
 */
uploadRoutes.post('/', upload.single('foto'), async (req, res, next) => {
  try {
    if (!req.file) {
       res.status(400).json({ error: 'Nenhum arquivo de imagem foi enviado!' });
       return;
    }

    const fileUrl = await uploadToS3(req.file);

     res.status(200).json({
      message: 'Upload concluído com sucesso!',
      url: fileUrl,
    });
    return;
  } catch (error: any) {
    console.error('Erro ao fazer upload no MinIO:', error);
     res.status(500).json({
      error: 'Erro interno ao salvar arquivo no S3',
      details: error.message,
    });
     return;
  }
});

export { uploadRoutes };
