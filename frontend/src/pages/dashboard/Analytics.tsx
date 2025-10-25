import React, { useState, useEffect } from 'react';
import { BarChart3, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { analyticsApi, DetailedAttack } from '../../services/api';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
  const [attacks, setAttacks] = useState<DetailedAttack[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttack, setSelectedAttack] = useState<DetailedAttack | null>(null);

  useEffect(() => {
    loadAttacks();
  }, [page]);

  const loadAttacks = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getDetailedAttacks(20, page);
      setAttacks(data.attacks);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      toast.error('Failed to load analytics data');
      console.error('Error loading attacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const filteredAttacks = attacks.filter(attack =>
    attack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attack.collection.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attack.attackType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-thunderlarra" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Analytics</h1>
              <p className="text-sm text-gray-600">Detailed attack analysis and payload inspection</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-thunderlarra">{total}</p>
            <p className="text-sm text-gray-600">Total Attacks</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="dashboard-card rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by description, collection, or attack type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
          />
        </div>
      </div>

      {/* Attacks List */}
      <div className="dashboard-card rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attack Details</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thunderlarra mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading analytics data...</p>
          </div>
        ) : filteredAttacks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No attacks found matching your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAttacks.map((attack) => (
              <div
                key={attack.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAttack(attack)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getSeverityIcon(attack.severity)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(attack.severity)}`}>
                        {attack.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(attack.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">{attack.description}</h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        <strong>Collection:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{attack.collection}</code>
                      </span>
                      <span>
                        <strong>Type:</strong> {attack.attackType}
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1"><strong>Payload:</strong></p>
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200 overflow-x-auto">
                        <pre className="text-xs text-gray-800 font-mono">{attack.payloadString}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Attack Detail Modal */}
      {selectedAttack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAttack(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Attack Details</h2>
                <button
                  onClick={() => setSelectedAttack(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Severity</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(selectedAttack.severity)}`}>
                      {selectedAttack.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Timestamp</label>
                  <p className="mt-1 text-gray-900">{new Date(selectedAttack.timestamp).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900">{selectedAttack.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Collection</label>
                  <p className="mt-1"><code className="bg-gray-100 px-2 py-1 rounded">{selectedAttack.collection}</code></p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Attack Type</label>
                  <p className="mt-1 text-gray-900">{selectedAttack.attackType}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Payload</label>
                  <div className="mt-1 bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto">
                    <pre className="text-sm text-gray-800 font-mono">{selectedAttack.payloadString}</pre>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      ✓ Blocked
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
