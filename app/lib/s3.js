import {
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'nyc3',
  endpoint: process.env.DIGITAL_OCEAN_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DIGITAL_OCEAN_S3_ACCESS_ID,
    secretAccessKey: process.env.DIGITAL_OCEAN_S3_ACCESS_SECRET,
  },
});

export async function uploadToS3(imageUrl, filename) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    const buffer = await response.arrayBuffer();

    // Generate a unique filename with timestamp
    const timestamp = new Date().getTime();
    const extension = filename.split('.').pop() || 'png';
    const key = `generated-images/${timestamp}-${filename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: 'grindao',
      Key: key,
      Body: buffer,
      ContentType: `image/${extension}`,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return the public URL
    return `${process.env.DIGITAL_OCEAN_S3_ENDPOINT}/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}
