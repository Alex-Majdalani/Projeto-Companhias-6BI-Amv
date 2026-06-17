import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

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
 * Define a política do bucket para leitura pública (anônima).
 */
async function setBucketPublicPolicy(bucketName: string): Promise<void> {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicRead',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };

  await s3Client.send(
    new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    })
  );
  console.log(`Política de leitura pública aplicada no bucket "${bucketName}".`);
}

/**
 * Garante que o bucket especificado exista no MinIO. Se não existir, cria-o.
 */
export async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" criado com sucesso no MinIO.`);
    await setBucketPublicPolicy(bucketName);
  } catch (error: any) {
    if (
      error.name === 'BucketAlreadyExists' || 
      error.name === 'BucketAlreadyOwnedByYou' || 
      error.$metadata?.httpStatusCode === 409
    ) {
      console.log(`Bucket "${bucketName}" já existe no MinIO.`);
      try {
        await setBucketPublicPolicy(bucketName);
      } catch (policyErr: any) {
        console.warn(`Aviso ao aplicar política no bucket existente "${bucketName}":`, policyErr.message);
      }
    } else {
      console.warn(`Aviso ao criar o bucket "${bucketName}" no MinIO (pode ser que já exista):`, error.message);
    }
  }
}

/**
 * Faz o upload de um arquivo recebido pelo Multer diretamente para o bucket do MinIO (S3).
 * Retorna a URL pública de acesso ao arquivo.
 */
export async function uploadToS3(
  file: Express.Multer.File,
  bucketName: string = process.env.S3_BUCKET_NAME || 'fotos-militares'
): Promise<string> {
  // Garante que o bucket existe antes de fazer o upload
  await ensureBucketExists(bucketName);

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
  return `${process.env.S3_ENDPOINT}/${bucketName}/${uniqueKey}`;
}
