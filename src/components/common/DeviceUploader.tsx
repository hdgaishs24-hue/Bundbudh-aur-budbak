import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  X,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileImage,
  RefreshCw,
  HardDrive,
  Eye,
} from 'lucide-react';
import {
  DeviceUploaderController,
  formatBytes,
  parseGoogleDriveUrl,
} from '../../lib/storageUploader';
import { UploadProgressInfo } from '../../types';

interface DeviceUploaderProps {
  label: string;
  accept: 'image' | 'video';
  currentValue?: string;
  folder: string;
  onUploadComplete: (url: string, storagePath?: string) => void;
  showGoogleDriveOption?: boolean;
}

export const DeviceUploader: React.FC<DeviceUploaderProps> = ({
  label,
  accept,
  currentValue = '',
  folder,
  onUploadComplete,
  showGoogleDriveOption = false,
}) => {
  const [activeTab, setActiveTab] = useState<'device' | 'url' | 'drive'>('device');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentValue);
  const [urlInput, setUrlInput] = useState<string>(currentValue);
  const [driveInput, setDriveInput] = useState<string>('');
  const [progressInfo, setProgressInfo] = useState<UploadProgressInfo>({
    progress: 0,
    bytesTransferred: 0,
    totalBytes: 0,
    isUploading: false,
    isPaused: false,
    error: null,
    downloadUrl: null,
  });
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<DeviceUploaderController | null>(null);

  const acceptedTypes =
    accept === 'image'
      ? 'image/jpeg,image/png,image/webp,image/jpg'
      : 'video/mp4,video/webm,video/ogg,video/quicktime';

  const maxSizeBytes = accept === 'image' ? 20 * 1024 * 1024 : 1000 * 1024 * 1024; // 20MB for images, 1GB for videos

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (file.size > maxSizeBytes) {
      setProgressInfo((prev) => ({
        ...prev,
        error: `File size exceeds the limit (${formatBytes(maxSizeBytes)})`,
      }));
      return;
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setProgressInfo({
      progress: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      isUploading: false,
      isPaused: false,
      error: null,
      downloadUrl: null,
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    controllerRef.current = new DeviceUploaderController();
    setProgressInfo((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
    }));

    try {
      const result = await controllerRef.current.uploadFile(selectedFile, {
        folder,
        filename: selectedFile.name,
        onProgress: (info) => {
          setProgressInfo(info);
        },
      });

      setPreviewUrl(result.downloadUrl);
      onUploadComplete(result.downloadUrl, result.storagePath);
    } catch (err: any) {
      setProgressInfo((prev) => ({
        ...prev,
        isUploading: false,
        error: err.message || 'Upload failed. Please retry.',
      }));
    }
  };

  const cancelUpload = () => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
    }
    setProgressInfo((prev) => ({
      ...prev,
      isUploading: false,
      error: 'Upload cancelled by user',
    }));
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(currentValue);
    setProgressInfo({
      progress: 0,
      bytesTransferred: 0,
      totalBytes: 0,
      isUploading: false,
      isPaused: false,
      error: null,
      downloadUrl: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveUrl = () => {
    if (!urlInput.trim()) return;
    setPreviewUrl(urlInput.trim());
    onUploadComplete(urlInput.trim());
  };

  const handleSaveDriveUrl = () => {
    const parsed = parseGoogleDriveUrl(driveInput);
    if (parsed.isDrive && parsed.embedUrl) {
      setPreviewUrl(parsed.embedUrl);
      onUploadComplete(parsed.embedUrl);
    } else {
      setProgressInfo((prev) => ({
        ...prev,
        error: 'Invalid Google Drive link format. Make sure the file sharing is set to Anyone with the link.',
      }));
    }
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Label and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          {accept === 'video' ? <FileVideo className="w-4 h-4 text-blue-400" /> : <FileImage className="w-4 h-4 text-amber-400" />}
          {label}
        </label>

        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'device'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Upload From Device
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Enter URL
          </button>

          {showGoogleDriveOption && (
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'drive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Google Drive
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DEVICE STORAGE UPLOAD */}
      {activeTab === 'device' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
            id={`file-input-${label.replace(/\s+/g, '-')}`}
          />

          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-blue-500/60 bg-slate-950/50 hover:bg-slate-950'
              }`}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Click to browse device storage or drag & drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports {accept === 'video' ? 'MP4, WebM, QuickTime (up to 1GB)' : 'JPG, PNG, WebP (up to 20MB)'}
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-transform active:scale-95 inline-flex items-center gap-2"
              >
                <HardDrive className="w-3.5 h-3.5" />
                Select from Phone / Computer
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    {accept === 'video' ? <FileVideo className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Unknown format'}
                    </p>
                  </div>
                </div>

                {!progressInfo.isUploading && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    title="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Progress Bar */}
              {progressInfo.isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-medium text-blue-400">Uploading to Firebase Storage...</span>
                    <span className="font-mono font-bold">{progressInfo.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200 ease-out rounded-full"
                      style={{ width: `${progressInfo.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{formatBytes(progressInfo.bytesTransferred)} transferred</span>
                    <span>Total: {formatBytes(progressInfo.totalBytes)}</span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {progressInfo.error && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{progressInfo.error}</span>
                </div>
              )}

              {/* Success Badge */}
              {progressInfo.progress === 100 && !progressInfo.isUploading && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>File successfully uploaded and linked to Firebase!</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {progressInfo.isUploading ? (
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel Upload
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                    >
                      Choose Different
                    </button>
                    <button
                      type="button"
                      onClick={startUpload}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload & Save to Firebase
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECT URL */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={accept === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/poster.jpg'}
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleSaveUrl}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
            >
              Set URL
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Paste a publicly accessible CDN or streaming link.
          </p>
        </div>
      )}

      {/* TAB 3: GOOGLE DRIVE */}
      {activeTab === 'drive' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleSaveDriveUrl}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
            >
              Attach Drive
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Ensure the Google Drive video has "Anyone with the link can view" permissions enabled.
          </p>
        </div>
      )}

      {/* MEDIA PREVIEW CARD */}
      {previewUrl && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Active Media Preview:</span>
            <span className="text-[11px] font-mono truncate max-w-[200px] text-slate-400">
              {previewUrl.startsWith('data:') ? 'Local preview data' : previewUrl}
            </span>
          </div>

          <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-48">
            {accept === 'image' ? (
              <img
                src={previewUrl}
                alt={label}
                referrerPolicy="no-referrer"
                className="max-h-48 object-contain"
              />
            ) : previewUrl.includes('drive.google.com') ? (
              <iframe
                src={previewUrl}
                title="Drive Video Preview"
                className="w-full h-44 border-0"
                allow="autoplay"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="max-h-48 w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
