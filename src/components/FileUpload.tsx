'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  isProcessing?: boolean;
  error?: string;
}

export function FileUpload({ onFileSelect, selectedFile, isProcessing, error }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'text/plain': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024,
    noClick: false,
    disabled: isProcessing,
  });

  const removeFile = () => {
    onFileSelect(null as any);
  };

  if (selectedFile) {
    return (
      <div className="animate-fade-in">
        <div className={cn(
          'flex items-center justify-between p-4 rounded-xl border-2 transition-colors',
          isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-xl',
              isDragReject ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
            )}>
              {isDragReject ? (
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[300px]">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)} • CSV
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            disabled={isProcessing}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Remove file"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        )}
      >
        <input {...getInputProps()} />
        <div className="relative z-10">
          <div className={cn(
            'mx-auto mb-4 p-4 rounded-2xl transition-colors',
            isDragActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
          )}>
            <Upload className={cn(
              'mx-auto w-10 h-10 transition-colors',
              isDragActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            )} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isDragActive ? 'Drop the CSV file here' : 'Drag & drop your CSV file'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isDragActive ? 'Release to upload' : 'or click to browse'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Max 10MB • .csv files only
          </p>
        </div>
        {isDragReject && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-red-600 dark:text-red-400 text-sm font-medium">
            Invalid file type. Please upload a CSV file.
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}