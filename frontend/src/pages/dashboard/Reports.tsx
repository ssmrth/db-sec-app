import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Calendar, File, AlertCircle, CheckCircle } from 'lucide-react';
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
      <div className="dashboard-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Reports</h1>
          <p className="text-sm text-gray-400 mt-1">AI-generated incident reports and compliance documentation</p>
        </div>
        <div className="text-right px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="text-2xl font-bold text-green-500">{reports.length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Available Reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Generated Reports</h2>
              <button
                onClick={loadReports}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Refresh List
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No reports generated yet</p>
                <p className="text-sm text-gray-500">
                  Reports are automatically generated when critical incidents are resolved
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedReports).map(([date, dateReports]) => (
                  <div key={date}>
                    <div className="flex items-center space-x-2 mb-4 px-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{date}</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {dateReports.map((report) => (
                        <div
                          key={report.filename}
                          className="group bg-gray-800/30 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 rounded-xl p-4 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                                  <File className="h-5 w-5 text-red-500" />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                  {report.filename}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(report.date)}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                                    {formatFileSize(report.size)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDownload(report.filename)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDelete(report.filename)}
                                disabled={deletingId === report.filename}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Report"
                              >
                                {deletingId === report.filename ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
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
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className="dashboard-card p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Report Automation
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              The system uses Gemini AI to automatically analyze blocked attacks and generate comprehensive PDF reports containing:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Attack Vector Analysis</p>
                  <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown of the injection technique</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Impact Assessment</p>
                  <p className="text-xs text-gray-500 mt-0.5">Potential data exposure calculation</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Mitigation Steps</p>
                  <p className="text-xs text-gray-500 mt-0.5">Recommended code fixes and patches</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700">
                Configure Report Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
