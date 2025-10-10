import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
  secure: true
});

/**
 * Faz upload de um buffer de imagem para o Cloudinary
 * @param {Buffer} fileBuffer - Buffer do arquivo de imagem
 * @param {string} folder - Pasta no Cloudinary (ex: 'equipment-images')
 * @returns {Promise<string>} - URL da imagem no Cloudinary
 */
export async function uploadToCloudinary(fileBuffer, folder = 'equipment-images') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamanho máximo
          { quality: 'auto:good' } // Otimizar qualidade
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Erro ao fazer upload para Cloudinary:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export default cloudinary;
