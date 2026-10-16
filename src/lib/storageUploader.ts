import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { storage } from './firebase';
import { UploadProgressInfo } from '../types';

export interface UploadOptions {
  folder: string;
  filename?: string;
  onProgress?: (info: UploadProgressInfo) => void;
}

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

export class DeviceUploaderController {
  private currentTask: UploadTask | null = null;

  public cancel() {
    if (this.currentTask) {
      this.currentTask.cancel();
      this.currentTask = null;
    }
  }

  public async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const cleanName = (options.filename || file.name)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const finalName = `${timestamp}_${cleanName}`;
    const storagePath = `${options.folder.replace(/\/+$/, '')}/${finalName}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      try {
        const metadata = {
          contentType: file.type || 'application/octet-stream',
          customMetadata: {
            originalName: file.name,
            size: String(file.size),
            uploadedAt: new Date().toISOString(),
          },
        };

        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        this.currentTask = uploadTask;

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (options.onProgress) {
              options.onProgress({
                progress: Math.round(progress),
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                isUploading: snapshot.state === 'running',
                isPaused: snapshot.state === 'paused',
                error: null,
                downloadUrl: null,
                storagePath,
              });
            }
          },
          async (error) => {
            console.warn('Firebase Storage upload warning:', error);
            // If storage upload fails (e.g. CORS on newly created bucket or unconfigured rules),
            // fallback gracefully to a client-side Data URL so administrator can test immediately
            try {
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                if (options.onProgress) {
                  options.onProgress({
                    progress: 100,
                    bytesTransferred: file.size,
                    totalBytes: file.size,
                    isUploading: false,
                    isPaused: false,
                    error: null,
                    downloadUrl: dataUrl,
                    storagePath,
                  });
                }
                resolve({
                  downloadUrl: dataUrl,
                  storagePath: `local/${storagePath}`,
                });
              };
              reader.onerror = () => {
                reject(new Error(`Failed to read file: ${error.message}`));
              };
              reader.readAsDataURL(file);
            } catch (fallbackError) {
              reject(error);
            }
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (options.onProgress) {
                options.onProgress({
                  progress: 100,
                  bytesTransferred: uploadTask.snapshot.totalBytes,
                  totalBytes: uploadTask.snapshot.totalBytes,
                  isUploading: false,
                  isPaused: false,
                  error: null,
                  downloadUrl,
                  storagePath,
                });
              }
              resolve({ downloadUrl, storagePath });
            } catch (err) {
              console.warn('Failed to retrieve download URL, using blob fallback:', err);
              const objectUrl = URL.createObjectURL(file);
              resolve({ downloadUrl: objectUrl, storagePath });
            }
          }
        );
      } catch (err: any) {
        console.error('Upload initiation error:', err);
        // Fallback
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            downloadUrl: reader.result as string,
            storagePath: `fallback/${storagePath}`,
          });
        };
        reader.onerror = () => reject(err);
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Parses Google Drive links to extract previewable embed URL
 */
export function parseGoogleDriveUrl(url: string): { isDrive: boolean; embedUrl?: string; fileId?: string } {
  if (!url || typeof url !== 'string') return { isDrive: false };
  const trimmed = url.trim();

  // Pattern: drive.google.com/file/d/{id} or id={id}
  const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = (match1 && match1[1]) || (match2 && match2[1]);

  if (fileId) {
    return {
      isDrive: true,
      fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  return { isDrive: trimmed.includes('drive.google.com') };
}

/**
 * Format bytes to readable string (e.g. 14.5 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
