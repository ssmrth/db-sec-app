import React, { useState, useEffect } from 'react';
import { BarChart3, AlertCircle, ChevronLeft, ChevronRight, Search, Filter, Download, Shield } from 'lucide-react';
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
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
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
      <div className="dashboard-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Detailed forensic analysis of blocked threats</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <p className="text-2xl font-bold text-blue-500">{total}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Incidents</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by description, collection, or attack type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center justify-center px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
        <button className="flex items-center justify-center px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      {/* Attacks List */}
      <div className="dashboard-card overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Incident Log</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading analytics data...</p>
          </div>
        ) : filteredAttacks.length === 0 ? (
          <div className="text-center py-24">
            <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No incidents found matching criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredAttacks.map((attack) => (
              <div
                key={attack.id}
                className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedAttack(attack)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getSeverityColor(attack.severity)}`}>
                        {attack.severity}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(attack.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                        {attack.attackType}
                      </span>
                    </div>
                    
                    <h3 className="text-white font-medium truncate pr-4 group-hover:text-blue-400 transition-colors">
                      {attack.description}
                    </h3>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-4">Collection: <span className="text-gray-400 font-mono">{attack.collection}</span></span>
                      <span className="truncate text-xs text-gray-600 font-mono bg-gray-900 px-2 py-0.5 rounded">
                        Payload: {attack.payloadString?.substring(0, 50)}...
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900/30">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center space-x-2 px-3 py-1.5 border border-gray-700 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <span className="text-sm text-gray-500">
              Page <span className="text-white font-medium">{page}</span> of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center space-x-2 px-3 py-1.5 border border-gray-700 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Attack Detail Modal */}
      {selectedAttack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAttack(null)}>
          <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Incident Details
                </h2>
                <button
                  onClick={() => setSelectedAttack(null)}
                  className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold">BLOCKED</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(selectedAttack.severity)}`}>
                        {selectedAttack.severity.toUpperCase()} SEVERITY
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</label>
                    <p className="mt-1 text-white font-mono text-sm">{new Date(selectedAttack.timestamp).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attack Type</label>
                    <p className="mt-1 text-white">{selectedAttack.attackType}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                    <p className="mt-1 text-white text-sm">{selectedAttack.description}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Collection</label>
                    <p className="mt-1"><code className="bg-gray-800 px-2 py-1 rounded text-blue-400 font-mono text-sm">{selectedAttack.collection}</code></p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payload Analysis</label>
                <div className="mt-2 bg-black rounded-lg border border-gray-800 overflow-hidden">
                  <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-mono">raw_payload</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Copy</button>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm text-red-400 font-mono">{selectedAttack.payloadString}</pre>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800 flex justify-end gap-3">
                <button onClick={() => setSelectedAttack(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium">
                  Close
                </button>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg shadow-blue-900/20">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
