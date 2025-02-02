import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function findImages() {
  console.log('Finding images...');
  try {
    const images = await prisma.image.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`Found ${images.length} images`);
    return images;
  } catch (error) {
    console.error('Failed to find images:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

export async function saveImage(imageData) {
  console.log('Saving image...');
  try {
    const image = await prisma.image.create({
      data: {
        name: imageData.name,
        symbol: imageData.symbol,
        description: imageData.description,
        prompt: imageData.prompt,
        imageUrl: imageData.imageUrl,
        downloadUrl: imageData.downloadUrl,
      }
    });
    console.log('Image saved successfully:', image.id);
    return image;
  } catch (error) {
    console.error('Failed to save image:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      imageData
    });
    throw error;
  }
}

export default prisma;
