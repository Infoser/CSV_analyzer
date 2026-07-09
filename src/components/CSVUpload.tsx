'use client';

import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { CSVParseResult } from '@/types';

interface CSVUploadProps {
  onPreview: (result: CSVParseResult) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  initialFile?: File | null;
}

export function CSVUpload({ onPreview, onError, isLoading, initialFile }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewResult, setPreviewResult] = useState<CSVParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      handleFilePreview(droppedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'text/plain': ['.csv', '.txt'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    disabled: isLoading,
  });

  const handleFilePreview = async (file: File) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to preview CSV');
      }

      setPreviewResult(data.result);
      onPreview(data.result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to preview CSV';
      setError(message);
      onError(message);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleFilePreview(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewResult(null);
    setError(null);
    onPreview({ headers: [], rows: [], totalRows: 0, previewRows: [] });
  };

  if (previewResult && !error) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">{file?.name}</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {formatFileSize(file?.size || 0)} • {previewResult.totalRows.toLocaleString()} rows • {previewResult.headers.length} columns
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium">Ready to import</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Preview shows first {Math.min(10, previewResult.totalRows)} of {previewResult.totalRows.toLocaleString()} rows.
            Click "Confirm Import" to process with AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', isLoading && 'opacity-50 pointer-events-none')}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          'bg-gray-50 dark:bg-gray-800/50',
          isDragActive && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
          isDragging && 'scale-[1.02] shadow-lg',
          !isDragActive && 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        )}
        role="button"
        tabIndex={0}
        aria-label="Dropzone for CSV file upload"
      >
        <input {...getInputProps()} aria-hidden="true" />
        
        <div className="relative z-10">
          <div className={cn(
            'mx-auto mb-4 p-3 rounded-xl transition-colors',
            isDragActive 
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}>
            <Upload className="w-8 h-8 mx-auto" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
          </h3>
          
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isDragActive 
              ? 'Release to upload' 
              : 'or click to browse'}
          </p>

          <label className="cursor-pointer">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Choose File
            </button>
          </label>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            CSV files up to 10MB • Columns will be auto-detected
          </p>
        </div>

        {isDragActive && (
          <div className="absolute inset-0 border-2 border-primary-500 rounded-2xl bg-primary-50/50 dark:bg-primary-900/20 pointer-events-none animate-pulse" />
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}