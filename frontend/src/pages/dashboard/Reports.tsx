import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Calendar, File, AlertCircle } from 'lucide-react';
import { reportsApi, Report } from '../../services/api';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getReports();
      setReports(data.reports);
    } catch (error: any) {
      toast.error('Failed to load reports');
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename: string) => {
    const downloadUrl = reportsApi.downloadReport(filename);
    window.open(downloadUrl, '_blank');
    toast.success('Downloading report...');
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(filename);
      await reportsApi.deleteReport(filename);
      toast.success('Report deleted successfully');
      loadReports();
    } catch (error: any) {
      toast.error('Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupReportsByDate = () => {
    const grouped: Record<string, Report[]> = {};
    
    reports.forEach(report => {
      const dateKey = new Date(report.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(report);
    });
    
    return grouped;
  };

  const groupedReports = groupReportsByDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-thunderlarra" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Reports</h1>
              <p className="text-sm text-gray-600">AI-generated incident reports and security analysis</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-thunderlarra">{reports.length}</p>
            <p className="text-sm text-gray-600">Total Reports</p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
          <button
            onClick={loadReports}
            className="text-sm text-thunderlarra hover:text-thunderlarra-dark font-medium"
          >
            Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thunderlarra mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No reports generated yet</p>
            <p className="text-sm text-gray-500">
              Reports are automatically generated when security incidents are detected
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedReports).map(([date, dateReports]) => (
              <div key={date}>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
                  <span className="text-xs text-gray-500">({dateReports.length} report{dateReports.length !== 1 ? 's' : ''})</span>
                </div>
                
                <div className="space-y-2">
                  {dateReports.map((report) => (
                    <div
                      key={report.filename}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <File className="h-6 w-6 text-red-600" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {report.filename}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(report.date)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(report.size)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleDownload(report.filename)}
                            className="flex items-center space-x-1 px-3 py-2 bg-thunderlarra text-white rounded-md hover:bg-thunderlarra-dark transition-colors"
                            title="Download report"
                          >
                            <Download className="h-4 w-4" />
                            <span className="text-sm">Download</span>
                          </button>
                          
                          <button
                            onClick={() => handleDelete(report.filename)}
                            disabled={deletingId === report.filename}
                            className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Delete report"
                          >
                            {deletingId === report.filename ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="dashboard-card rounded-lg p-6 bg-gradient-to-r from-thunderlarra-light to-aged-jade-light">
        <h3 className="font-semibold text-gray-900 mb-2">About Security Reports</h3>
        <p className="text-sm text-gray-700 mb-4">
          Security reports are automatically generated using AI when NoSQL injection attacks are detected. 
          Each report includes detailed analysis, impact assessment, and remediation recommendations.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-900">✓ Automated Generation</p>
            <p className="text-gray-600">Reports created instantly on attack detection</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">✓ AI-Powered Analysis</p>
            <p className="text-gray-600">Comprehensive insights using Gemini AI</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">✓ Email Delivery</p>
            <p className="text-gray-600">Automatically sent to configured recipients</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
