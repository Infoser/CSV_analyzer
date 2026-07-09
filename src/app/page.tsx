'use client';

import { useState, useCallback, useRef } from 'react';
import { CSVUpload } from '@/components/CSVUpload';
import { DataTable } from '@/components/DataTable';
import { ResultsTable } from '@/components/ResultsTable';
import { ArrowRight, CheckCircle, RotateCcw, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSVParseResult, ParseResult } from '@/types';

type Step = 'upload' | 'preview' | 'confirm' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [previewData, setPreviewData] = useState<CSVParseResult | null>(null);
  const [results, setResults] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePreview = useCallback((result: CSVParseResult) => {
    setPreviewData(result);
    if (result.totalRows > 0) {
      setStep('preview');
    }
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!previewData) return;
    
    setStep('confirm');
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const formData = new FormData();
      const csvContent = [
        previewData.headers.join(','),
        ...previewData.rows.map(row => 
          previewData.headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'upload.csv', { type: 'text/csv' });
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract leads');
      }

      setResults(data.result);
      setStep('results');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process CSV';
      setError(message);
      setStep('preview');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [previewData]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep('upload');
    setPreviewData(null);
    setResults(null);
  }, []);

  const handleNewImport = useCallback(() => {
    setStep('upload');
    setPreviewData(null);
    setResults(null);
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!results) return;
    
    const headers = [
      'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
      'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
      'crm_note', 'data_source', 'possession_time', 'description'
    ];
    
    const rows = results.data.map(lead => 
      headers.map(h => `"${String((lead as any)[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `grow_easy_leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [results]);

  const steps = [
    { id: 'upload' as Step, label: 'Upload', icon: <FileText className="w-4 h-4" /> },
    { id: 'preview' as Step, label: 'Preview', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'confirm' as Step, label: 'AI Processing', icon: <RotateCcw className="w-4 h-4 animate-spin" /> },
    { id: 'results' as Step, label: 'Results', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const getStepStatus = (stepId: Step) => {
    const currentIndex = steps.findIndex(s => s.id === step);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">GrowEasy CSV Importer</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered CRM lead extraction</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1" aria-label="Import progress">
              {steps.map((stepInfo, index) => {
                const status = getStepStatus(stepInfo.id);
                return (
                  <div key={stepInfo.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                        status === 'completed' && 'bg-green-500 text-white',
                        status === 'active' && 'bg-primary-600 text-white',
                        status === 'pending' && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      )}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          stepInfo.icon
                        )}
                      </div>
                      <span className={cn(
                        'text-sm font-medium hidden sm:block',
                        status === 'active' && 'text-primary-600 dark:text-primary-400',
                        status === 'completed' && 'text-green-600 dark:text-green-400',
                        status === 'pending' && 'text-gray-400 dark:text-gray-500'
                      )}>
                        {stepInfo.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        'w-12 h-0.5 rounded-full',
                        index < steps.findIndex(s => s.id === step) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      )} />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && step !== 'results' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="animate-fade-in">
          {step === 'upload' && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Upload Your CSV File
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Drag & drop or click to browse. Supports any CSV format with automatic column detection.
                </p>
              </div>

              <CSVUpload
                onPreview={handlePreview}
                onError={handleError}
                isLoading={isProcessing}
              />

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2 inline-block">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Any Format</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Facebook, Google Ads, Excel, CRM exports</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mb-2 inline-block">
                    <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">AI Mapping</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Intelligently maps columns to CRM fields</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-2 inline-block">
                    <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Validated Output</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clean, structured CRM-ready records</p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    Preview Data
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Review the first {Math.min(10, previewData.totalRows)} rows before AI processing
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isProcessing}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium transition-colors',
                      isProcessing && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Confirm & Extract with AI'}
                  </button>
                </div>
              </div>

              <DataTable
                headers={previewData.headers}
                rows={previewData.rows}
                title="CSV Preview"
                rowsPerPage={15}
                searchable={true}
              />
            </div>
          )}

          {step === 'confirm' && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <div className={cn(
                  'mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center',
                  isProcessing ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-green-100 dark:bg-green-900/30'
                )}>
                  {isProcessing ? (
                    <RotateCcw className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin" />
                  ) : (
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {isProcessing ? 'AI Processing...' : 'Ready for Results'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {isProcessing 
                    ? 'Intelligently mapping columns and extracting CRM leads...'
                    : 'Your data has been processed. Click below to view results.'}
                </p>
              </div>

              {isProcessing && (
                <div className="space-y-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {progress < 30 ? 'Analyzing column structure...' :
                     progress < 60 ? 'Mapping fields with AI...' :
                     progress < 90 ? 'Extracting and validating leads...' :
                     'Finalizing results...'}
                  </p>
                </div>
              )}

              {!isProcessing && (
                <button
                  onClick={() => setStep('results')}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                  View Results
                </button>
              )}
            </div>
          )}

          {step === 'results' && results && (
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    Import Complete
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {results.total_imported} leads imported &bull; {results.total_skipped} skipped
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleNewImport}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                  >
                    New Import
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              <ResultsTable
                leads={results.data}
                skipped={results.skipped}
                totalImported={results.total_imported}
                totalSkipped={results.total_skipped}
                onExport={handleExport}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            GrowEasy AI CSV Importer &bull; Built with Next.js 14, TypeScript & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}