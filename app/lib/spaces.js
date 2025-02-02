import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: process.env.DIGITAL_OCEAN_S3_ENDPOINT,
  region: 'nyc3',
  credentials: {
    accessKeyId: process.env.DIGITAL_OCEAN_S3_ACCESS_ID,
    secretAccessKey: process.env.DIGITAL_OCEAN_S3_ACCESS_SECRET,
  },
});

const BUCKET_NAME = 'cheshireart';

export async function uploadImage(imageBuffer, fileName, contentType) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `gallery/${fileName}`,
    Body: imageBuffer,
    ContentType: contentType,
    ACL: 'public-read',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${process.env.DIGITAL_OCEAN_S3_ENDPOINT}/${BUCKET_NAME}/gallery/${fileName}`;
  } catch (error) {
    console.error('Error uploading to DigitalOcean Spaces:', error);
    throw error;
  }
}

export async function getSignedDownloadUrl(fileName) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `gallery/${fileName}`,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

export function getPublicUrl(fileName) {
  return `${process.env.DIGITAL_OCEAN_S3_ENDPOINT}/${BUCKET_NAME}/gallery/${fileName}`;
}
