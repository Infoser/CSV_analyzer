'use client';

import { useState } from 'react';
import { cn, truncate } from '@/lib/utils';
import { ExtractedLead, SkippedRecord, CRMStatus, DataSource } from '@/types';
import { 
  CheckCircle, XCircle, AlertCircle, Info, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, Search, Filter,
  Eye, EyeOff, Mail, Phone, MapPin, Building, User, 
  Calendar, Tag, FileText
} from 'lucide-react';

interface ResultsTableProps {
  leads: ExtractedLead[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  onExport?: () => void;
}

const STATUS_COLORS: Record<CRMStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  DID_NOT_CONNECT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  BAD_LEAD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  SALE_DONE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const SOURCE_COLORS: Record<DataSource, string> = {
  leads_on_demand: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  meridian_tower: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  eden_park: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  varah_swamy: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  sarjapur_plots: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  '': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

function StatusBadge({ status }: { status: CRMStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[status] || STATUS_COLORS.GOOD_LEAD_FOLLOW_UP)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SourceBadge({ source }: { source: DataSource }) {
  if (!source) return null;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', SOURCE_COLORS[source] || SOURCE_COLORS[''])}>
      {source.replace(/_/g, ' ')}
    </span>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = percentage >= 80 ? 'bg-green-600' : percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600';
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all', bgColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium', color)}>{percentage}%</span>
    </div>
  );
}

function LeadRow({ lead, index }: { lead: ExtractedLead; index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  const fields = [
    { key: 'created_at', label: 'Created', icon: Calendar },
    { key: 'name', label: 'Name', icon: User },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'country_code', label: 'Country Code', icon: MapPin },
    { key: 'mobile_without_country_code', label: 'Mobile', icon: Phone },
    { key: 'company', label: 'Company', icon: Building },
    { key: 'city', label: 'City', icon: MapPin },
    { key: 'state', label: 'State', icon: MapPin },
    { key: 'country', label: 'Country', icon: MapPin },
    { key: 'lead_owner', label: 'Owner', icon: User },
    { key: 'crm_status', label: 'Status', icon: Tag, render: (v: string) => <StatusBadge status={v as CRMStatus} /> },
    { key: 'data_source', label: 'Source', icon: FileText, render: (v: string) => <SourceBadge source={v as DataSource} /> },
    { key: 'possession_time', label: 'Possession', icon: Calendar },
    { key: 'description', label: 'Description', icon: FileText },
    { key: 'crm_note', label: 'Notes', icon: FileText },
  ].filter(f => lead[f.key as keyof ExtractedLead]);

  return (
    <>
      <tr className={cn('transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50')}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
          #{index + 1}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
          <ConfidenceIndicator confidence={lead.confidence} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {lead.matched_fields.slice(0, 4).map(field => (
              <span key={field} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {field}
              </span>
            ))}
            {lead.matched_fields.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                +{lead.matched_fields.length - 4}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-sm"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Less' : 'Details'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 dark:bg-gray-800/50">
          <td colSpan={4} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fields.map(field => {
                const Icon = field.icon;
                const value = lead[field.key as keyof ExtractedLead] as string;
                if (!value) return null;
                return (
                  <div key={field.key} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {field.render ? field.render(value) : value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SkippedRow({ skipped, index }: { skipped: SkippedRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <tr className={cn('transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50')}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
        #{index + 1}
      </td>
      <td className="px-4 py-3">
        <ConfidenceIndicator confidence={skipped.confidence} />
      </td>
      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
        {skipped.reason}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Less' : 'View Data'}
        </button>
      </td>
    </tr>
  );
}

export function ResultsTable({ leads, skipped, totalImported, totalSkipped, onExport }: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkipped, setShowSkipped] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredLeads = leads.filter(lead =>
    Object.values(lead).some(val => 
      String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Import Results</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalImported} imported &bull; {totalSkipped} skipped &bull; {leads.length} displayed
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search results..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowSkipped(!showSkipped)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors',
              showSkipped
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <AlertCircle className="w-4 h-4" />
            {showSkipped ? 'Hide Skipped' : `Show Skipped (${skipped.length})`}
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/90 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 w-16">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 w-32">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                Fields Mapped
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedLeads.map((lead, index) => (
              <LeadRow key={lead.id} lead={lead} index={(currentPage - 1) * rowsPerPage + index} />
            ))}
          </tbody>
        </table>
      </div>

      {showSkipped && skipped.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Skipped Records ({skipped.length})
            </h4>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full min-w-max">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/90 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 w-32">Confidence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 w-24">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {skipped.map((record, index) => (
                  <SkippedRow key={record.id} skipped={record} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredLeads.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {searchQuery ? 'No matching results' : 'No leads imported'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Try adjusting your search' : 'The CSV may not contain valid lead data'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages} &bull; {filteredLeads.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}