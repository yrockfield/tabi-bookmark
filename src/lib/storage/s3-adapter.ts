import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { TripIndex, TripData, TripIndexItem } from '@/types';

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const REGION = process.env.S3_REGION || 'ap-northeast-1';
const ENDPOINT = process.env.S3_ENDPOINT || undefined;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';

const isS3Configured = Boolean(BUCKET_NAME && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

const s3Client = isS3Configured
  ? new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
      forcePathStyle: Boolean(ENDPOINT),
    })
  : null;

// Local storage fallback directory
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

function ensureLocalDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Stream helper for S3 GetObject
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// Low-level Object Operations
async function getObjectText(key: string): Promise<string | null> {
  if (isS3Configured && s3Client) {
    try {
      const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
      const response = await s3Client.send(command);
      if (response.Body) {
        return await streamToString(response.Body);
      }
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      console.error(`S3 GetObject Error (${key}):`, err);
      throw err;
    }
  }

  // Fallback to local filesystem
  const localFilePath = path.join(LOCAL_DATA_DIR, key);
  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(localFilePath, 'utf-8');
  }
  return null;
}

async function putObjectText(key: string, content: string, contentType: string = 'application/json'): Promise<void> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return;
  }

  // Fallback to local filesystem
  const localFilePath = path.join(LOCAL_DATA_DIR, key);
  ensureLocalDir(path.dirname(localFilePath));
  fs.writeFileSync(localFilePath, content, 'utf-8');
}

async function deleteObject(key: string): Promise<void> {
  if (isS3Configured && s3Client) {
    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    await s3Client.send(command);
    return;
  }

  const localFilePath = path.join(LOCAL_DATA_DIR, key);
  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }
}

// Business Domain Storage Logic

export async function getTripIndex(): Promise<TripIndex> {
  const text = await getObjectText('trips/index.json');
  if (!text) {
    const initialIndex: TripIndex = {
      allowedGlobalEmails: process.env.ALLOWED_EMAILS
        ? process.env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase())
        : [],
      trips: [],
    };
    await putObjectText('trips/index.json', JSON.stringify(initialIndex, null, 2));
    return initialIndex;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { allowedGlobalEmails: [], trips: [] };
  }
}

export async function saveTripIndex(index: TripIndex): Promise<void> {
  await putObjectText('trips/index.json', JSON.stringify(index, null, 2));
}

export async function getTripData(tripId: string): Promise<TripData | null> {
  const text = await getObjectText(`trips/${tripId}/data.json`);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function saveTripData(data: TripData): Promise<void> {
  const tripId = data.metadata.id;
  await putObjectText(`trips/${tripId}/data.json`, JSON.stringify(data, null, 2));

  // Sync summary to trip index
  const index = await getTripIndex();
  const membersEmails = Array.from(
    new Set([data.metadata.ownerEmail, ...data.members.map((m) => m.email.toLowerCase())])
  );

  const existingIdx = index.trips.findIndex((t) => t.id === tripId);
  const updatedItem: TripIndexItem = {
    id: data.metadata.id,
    title: data.metadata.title,
    destination: data.metadata.destination,
    startDate: data.metadata.startDate,
    endDate: data.metadata.endDate,
    coverImage: data.metadata.coverImage,
    ownerEmail: data.metadata.ownerEmail,
    members: membersEmails,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    index.trips[existingIdx] = updatedItem;
  } else {
    index.trips.unshift(updatedItem);
  }

  await saveTripIndex(index);
}

export async function deleteTripData(tripId: string): Promise<void> {
  await deleteObject(`trips/${tripId}/data.json`);
  const index = await getTripIndex();
  index.trips = index.trips.filter((t) => t.id !== tripId);
  await saveTripIndex(index);
}

export async function saveTripPhoto(tripId: string, filename: string, base64Data: string): Promise<string> {
  const key = `trips/${tripId}/photos/${filename}`;
  const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    });
    await s3Client.send(command);
    if (ENDPOINT) {
      return `${ENDPOINT}/${BUCKET_NAME}/${key}`;
    }
    return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
  }

  // Local storage: save image buffer and return data URL or local serving endpoint
  const localFilePath = path.join(LOCAL_DATA_DIR, key);
  ensureLocalDir(path.dirname(localFilePath));
  fs.writeFileSync(localFilePath, buffer);
  return base64Data; // Return base64 or file reference
}
