import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Necessário para compatibilidade com MinIO
});

/**
 * Faz o upload de um arquivo recebido pelo Multer diretamente para o bucket do MinIO (S3).
 * Retorna a URL pública de acesso ao arquivo.
 */
export async function uploadToS3(file: Express.Multer.File): Promise<string> {
  const bucketName = process.env.S3_BUCKET_NAME || 'fotos-militares';
  const fileExtension = file.originalname.split('.').pop();
  const uniqueKey = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  // Retorna a URL pública estruturada para o MinIO
  // Exemplo: https://gestao-minio.1632cm.easypanel.host/fotos-militares/1627382-38291.png
  return `${process.env.S3_ENDPOINT}/${bucketName}/${uniqueKey}`;
}
