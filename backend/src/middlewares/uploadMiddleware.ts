import multer from 'multer';

// Armazena arquivos temporariamente em memória como Buffer
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite máximo de 5MB por foto
  },
  fileFilter: (req, file, callback) => {
    // Aceita apenas arquivos de imagem
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Formato de arquivo inválido. Apenas imagens são permitidas!'));
    }
  },
});
