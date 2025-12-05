import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { dashboardApi, Attack } from '../../services/api';
import socketService from '../../services/socket';
import toast from 'react-hot-toast';

interface AttackWithSummary extends Attack {
  summary?: string;
}

const AttackHistory: React.FC = () => {
  const [attacks, setAttacks] = useState<AttackWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAttacks();
    
    // Set up real-time updates
    const unsubscribeAttacks = socketService.onNewAttack((attack) => {
      const attackWithSummary = {
        ...attack,
        summary: generateSummary(attack)
      };
      setAttacks(prev => [attackWithSummary, ...prev]);
      toast.success(`New attack detected: ${attack.description}`, {
        icon: '🔔',
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #334155'
        }
      });
    });

    return () => {
      unsubscribeAttacks();
    };
  }, []);

  useEffect(() => {
    loadAttacks();
  }, [page]);

  const loadAttacks = async () => {
    try {
      setLoading(true);
      console.log('Loading attack history...');
      const data = await dashboardApi.getRecentAttacks(15, page);
      console.log('Attack history response:', data);
      
      if (!data || !data.attacks) {
        console.log('No attacks in response');
        setAttacks([]);
        setTotalPages(1);
        return;
      }
      
      // Generate brief summaries for each attack
      const attacksWithSummaries = (data.attacks || []).map((attack: Attack) => ({
        ...attack,
        summary: generateSummary(attack)
      }));
      
      console.log(`Loaded ${attacksWithSummaries.length} attacks`);
      setAttacks(attacksWithSummaries);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading attacks:', error);
      toast.error('Failed to load attack history: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Generate a brief 2-3 line summary based on attack data
  const generateSummary = (attack: Attack): string => {
    const timestamp = new Date(attack.timestamp).toLocaleString();
    const severityText = attack.severity === 'critical' ? 'Critical severity' : 
                        attack.severity === 'high' ? 'High severity' : 'Medium severity';
    
    let attackVector = 'NoSQL injection';
    let impact = 'attempted to manipulate database queries';
    
    if (attack.description.toLowerCase().includes('auth') || attack.description.toLowerCase().includes('bypass')) {
      attackVector = 'Authentication bypass';
      impact = 'attempted to gain unauthorized access by bypassing login credentials';
    } else if (attack.description.toLowerCase().includes('$where') || attack.description.toLowerCase().includes('javascript')) {
      attackVector = 'JavaScript injection';
      impact = 'attempted to execute arbitrary JavaScript code in the database';
    } else if (attack.description.toLowerCase().includes('$ne') || attack.description.toLowerCase().includes('not-equal')) {
      attackVector = 'Operator injection';
      impact = 'used MongoDB operators to bypass query restrictions';
    } else if (attack.description.toLowerCase().includes('$gt') || attack.description.toLowerCase().includes('greater')) {
      attackVector = 'Comparison injection';
      impact = 'manipulated comparison operators to extract data';
    }
    
    return `${severityText} ${attackVector.toLowerCase()} detected at ${timestamp}. The attacker ${impact}. Target collection: ${attack.collection}.`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-green-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <History className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Attack History</h1>
              <p className="text-gray-400 text-sm mt-1">Complete log of detected injection attempts with analysis</p>
            </div>
          </div>
          <button
            onClick={() => loadAttacks()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Attack List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="dashboard-card p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (attacks || []).length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <Shield className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Attacks Recorded</h3>
            <p className="text-gray-500">When injection attempts are detected, they will appear here with detailed analysis.</p>
          </div>
        ) : (
          (attacks || []).map((attack) => (
            <div
              key={attack.id}
              className={`dashboard-card overflow-hidden border-l-4 ${getSeverityBg(attack.severity)} transition-all duration-200`}
            >
              {/* Attack Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === attack.id ? null : attack.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    {/* Top Row - Severity & Time */}
                    <div className="flex items-center flex-wrap gap-3 mb-4">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${getSeverityColor(attack.severity)}`}>
                        {attack.severity}
                      </span>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(attack.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Attack Title */}
                    <h3 className="text-white font-semibold text-lg mb-3">{attack.description}</h3>
                    
                    {/* Summary - Always visible */}
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {attack.summary}
                    </p>
                  </div>
                  
                  <button className="p-2 text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-1">
                    {expandedId === attack.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedId === attack.id && (
                <div className="px-6 pb-6 border-t border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Target Collection</p>
                      <code className="text-blue-400 font-mono text-sm">{attack.collection}</code>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Attack Type</p>
                      <span className="text-white">{attack.type}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-black/30 rounded-lg p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Payload</p>
                    <div className="bg-black/50 rounded p-3 max-h-64 overflow-y-auto">
                      <code className="text-red-400 font-mono text-xs block whitespace-pre-wrap break-words leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {(() => {
                          try {
                            // Try to pretty-print JSON
                            const parsed = JSON.parse(attack.payload);
                            return JSON.stringify(parsed, null, 2);
                          } catch {
                            // Return as-is if not valid JSON
                            return attack.payload;
                          }
                        })()}
                      </code>
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-800/30 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Full Analysis</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{attack.summary}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && (attacks || []).length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page <span className="text-white font-medium">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AttackHistory;
