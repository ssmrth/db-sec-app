import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Target, Clock, TrendingUp, AlertTriangle, Shield, PieChart, RefreshCw } from 'lucide-react';
import { dashboardApi, Attack } from '../../services/api';
import socketService from '../../services/socket';

interface AttackStats {
  byEndpoint: { endpoint: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byHour: { hour: string; count: number }[];
  byType: { type: string; count: number }[];
  total: number;
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AttackStats>({
    byEndpoint: [],
    bySeverity: [],
    byHour: [],
    byType: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading analytics data...');
      const data = await dashboardApi.getRecentAttacks(100, 1);
      console.log('Received data:', data);
      
      if (!data || !data.attacks) {
        console.log('No attacks data in response');
        setStats({
          byEndpoint: [],
          bySeverity: [],
          byHour: [],
          byType: [],
          total: 0
        });
        return;
      }
      
      // Process attacks to generate statistics
      const attacks = data.attacks || [];
      console.log(`Processing ${attacks.length} attacks`);
      const processedStats = processAttackData(attacks);
      console.log('Processed stats:', processedStats);
      setStats(processedStats);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
      // Don't reset stats on error - keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    
    // Set up real-time updates
    const unsubscribeAttacks = socketService.onNewAttack((attack) => {
      // Update stats when new attack arrives
      setStats(prev => {
        const newStats = { ...prev };
        newStats.total += 1;
        
        // Update severity counts
        const severityIndex = newStats.bySeverity.findIndex(s => s.severity === attack.severity);
        if (severityIndex >= 0) {
          newStats.bySeverity = [...newStats.bySeverity];
          newStats.bySeverity[severityIndex] = { 
            ...newStats.bySeverity[severityIndex], 
            count: newStats.bySeverity[severityIndex].count + 1 
          };
        } else {
          newStats.bySeverity = [...newStats.bySeverity, { severity: attack.severity, count: 1 }];
        }
        
        // Update attack types
        let attackType = 'NoSQL Injection';
        if (attack.description?.includes('bypass')) attackType = 'Auth Bypass';
        else if (attack.description?.includes('$ne') || attack.description?.includes('Not-equal')) attackType = '$ne Operator';
        else if (attack.description?.includes('$gt') || attack.description?.includes('Greater')) attackType = '$gt Operator';
        
        const typeIndex = newStats.byType.findIndex(t => t.type === attackType);
        if (typeIndex >= 0) {
          newStats.byType = [...newStats.byType];
          newStats.byType[typeIndex] = { 
            ...newStats.byType[typeIndex], 
            count: newStats.byType[typeIndex].count + 1 
          };
        } else {
          newStats.byType = [...newStats.byType, { type: attackType, count: 1 }];
        }

        // Update endpoint counts
        let endpoint = `/${attack.collection}`;
        try {
          const payload = JSON.parse(attack.payload);
          if (payload.loginAttempt) endpoint = '/auth/login';
          else if (payload.searchQuery) endpoint = '/products/search';
          else if (payload.userLookup) endpoint = '/users/:id';
          else if (payload.productFilter) endpoint = '/products/filter';
        } catch {}

        const endpointIndex = newStats.byEndpoint.findIndex(e => e.endpoint === endpoint);
        if (endpointIndex >= 0) {
          newStats.byEndpoint = [...newStats.byEndpoint];
          newStats.byEndpoint[endpointIndex] = { 
            ...newStats.byEndpoint[endpointIndex], 
            count: newStats.byEndpoint[endpointIndex].count + 1 
          };
        } else {
          newStats.byEndpoint = [...newStats.byEndpoint, { endpoint, count: 1 }];
        }

        // Update hour counts
        try {
          const hour = new Date(attack.timestamp).getHours();
          const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
          const hourIndex = newStats.byHour.findIndex(h => h.hour === hourLabel);
          if (hourIndex >= 0) {
            newStats.byHour = [...newStats.byHour];
            newStats.byHour[hourIndex] = { 
              ...newStats.byHour[hourIndex], 
              count: newStats.byHour[hourIndex].count + 1 
            };
          } else {
            newStats.byHour = [...newStats.byHour, { hour: hourLabel, count: 1 }];
            newStats.byHour.sort((a, b) => a.hour.localeCompare(b.hour));
          }
        } catch {}
        
        return newStats;
      });
    });

    return () => {
      unsubscribeAttacks();
    };
  }, [loadAnalytics]);

  const processAttackData = (attacks: Attack[]): AttackStats => {
    if (!attacks || (attacks || []).length === 0) {
      return {
        byEndpoint: [],
        bySeverity: [],
        byHour: [],
        byType: [],
        total: 0
      };
    }

    const endpointCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    attacks.forEach(attack => {
      // Extract endpoint from payload
      let endpoint = `/${attack.collection || 'unknown'}`;
      try {
        const payload = typeof attack.payload === 'string' ? JSON.parse(attack.payload) : attack.payload;
        if (payload.endpoint) {
          endpoint = payload.endpoint;
        } else if (payload.loginAttempt) {
          endpoint = '/auth/login';
        } else if (payload.searchQuery) {
          endpoint = '/products/search';
        } else if (payload.userLookup) {
          endpoint = '/users/:id';
        } else if (payload.productFilter) {
          endpoint = '/products/filter';
        }
      } catch {}
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;

      // Count by severity
      const severity = attack.severity || 'medium';
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;

      // Count by hour
      try {
        const timestamp = attack.timestamp;
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        const hour = date.getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        hourCounts[hourLabel] = (hourCounts[hourLabel] || 0) + 1;
      } catch {}

      // Count by attack type
      let type = 'NoSQL Injection';
      const desc = attack.description || '';
      if (desc.includes('bypass') || desc.includes('Authentication')) {
        type = 'Auth Bypass';
      } else if (desc.includes('JavaScript')) {
        type = 'JS Injection';
      } else if (desc.includes('$ne') || desc.includes('Not-equal')) {
        type = '$ne Operator';
      } else if (desc.includes('$gt') || desc.includes('Greater')) {
        type = '$gt Operator';
      }
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return {
      byEndpoint: (Object.entries(endpointCounts) || [])
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      bySeverity: (Object.entries(severityCounts) || [])
        .map(([severity, count]) => ({ severity, count }))
        .sort((a, b) => {
          const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
        }),
      byHour: (Object.entries(hourCounts) || [])
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
      byType: (Object.entries(typeCounts) || [])
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      total: (attacks || []).length
    };
  };

  const getBarWidth = (count: number, max: number) => {
    return max > 0 ? `${Math.max((count / max) * 100, 5)}%` : '5%';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="dashboard-card p-6 h-24"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-card p-6 h-28"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="dashboard-card p-6 h-80"></div>
          <div className="dashboard-card p-6 h-80"></div>
        </div>
      </div>
    );
  }

  const maxEndpointCount = Math.max(...((stats.byEndpoint || []).map(e => e.count)), 1);
  const maxHourCount = Math.max(...((stats.byHour || []).map(h => h.count)), 1);
  const maxTypeCount = Math.max(...((stats.byType || []).map(t => t.count)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <BarChart3 className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Security Analytics</h1>
              <p className="text-gray-400 text-sm mt-1">Attack patterns and vulnerability insights</p>
            </div>
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          Error: {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">Total Attacks</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <Shield className="h-10 w-10 text-blue-500/30" />
          </div>
        </div>
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">Critical</p>
              <p className="text-3xl font-bold text-red-500">
                {stats.bySeverity.find(s => s.severity === 'critical')?.count || 0}
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-500/30" />
          </div>
        </div>
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">High</p>
              <p className="text-3xl font-bold text-orange-500">
                {stats.bySeverity.find(s => s.severity === 'high')?.count || 0}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-500/30" />
          </div>
        </div>
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">Medium</p>
              <p className="text-3xl font-bold text-yellow-500">
                {stats.bySeverity.find(s => s.severity === 'medium')?.count || 0}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500/30" />
          </div>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="dashboard-card p-12 text-center">
          <Shield className="h-16 w-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Attack Data Yet</h3>
          <p className="text-gray-500 mb-4">Analytics will populate as attacks are detected.</p>
          <p className="text-gray-600 text-sm">Try launching an attack simulation from the Overview page.</p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Targeted Endpoints */}
            <div className="dashboard-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Target className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-bold text-white">Most Targeted Endpoints</h3>
              </div>
              
              {(stats.byEndpoint || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No endpoint data available</div>
              ) : (
                <div className="space-y-5">
                  {(stats.byEndpoint || []).map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm text-gray-300 font-mono">{item.endpoint}</code>
                        <span className="text-sm text-gray-400 font-medium">{item.count} attacks</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: getBarWidth(item.count, maxEndpointCount) }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attack Types Distribution */}
            <div className="dashboard-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <PieChart className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-bold text-white">Attack Types</h3>
              </div>
              
              {(stats.byType || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No attack type data available</div>
              ) : (
                <div className="space-y-5">
                  {(stats.byType || []).map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{item.type}</span>
                        <span className="text-sm text-gray-400 font-medium">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: getBarWidth(item.count, maxTypeCount) }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attack Timeline - Bar Chart */}
          {(stats.byHour || []).length > 0 && (
            <div className="dashboard-card p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-white">Attack Timeline</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">Number of attacks detected at each hour of the day</p>
              
              {/* Chart Container */}
              <div style={{ display: 'flex' }}>
                {/* Y-Axis */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingRight: '12px',
                  paddingBottom: '28px',
                  height: '200px'
                }}>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{maxHourCount}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{Math.round(maxHourCount * 0.75)}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{Math.round(maxHourCount * 0.5)}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{Math.round(maxHourCount * 0.25)}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>0</span>
                </div>
                
                {/* Chart Area */}
                <div style={{ flex: 1, position: 'relative' }}>
                  {/* Grid Lines */}
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: '172px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    pointerEvents: 'none'
                  }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ 
                        width: '100%', 
                        height: '1px', 
                        backgroundColor: 'rgba(75, 85, 99, 0.3)'
                      }} />
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: '6px', 
                    height: '172px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {(stats.byHour || []).map((item, index) => {
                      const barHeight = maxHourCount > 0 ? (item.count / maxHourCount) * 160 : 0;
                      
                      return (
                        <div 
                          key={index} 
                          style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end'
                          }}
                        >
                          {/* Count label */}
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#E5E7EB', 
                            marginBottom: '4px',
                            fontWeight: '600'
                          }}>
                            {item.count}
                          </span>
                          {/* Bar */}
                          <div 
                            style={{ 
                              width: '100%',
                              maxWidth: '36px',
                              height: `${Math.max(barHeight, 6)}px`,
                              backgroundColor: '#3B82F6',
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* X-Axis Labels */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    marginTop: '8px',
                    borderTop: '1px solid rgba(75, 85, 99, 0.5)',
                    paddingTop: '8px'
                  }}>
                    {(stats.byHour || []).map((item, index) => {
                      const hour = parseInt(item.hour.split(':')[0]);
                      const ampm = hour >= 12 ? 'p' : 'a';
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      
                      return (
                        <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#9CA3AF'
                          }}>
                            {hour12}{ampm}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(75, 85, 99, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '2px' }} />
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Attacks detected</span>
                </div>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>|</span>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Peak: <strong style={{ color: '#E5E7EB' }}>{maxHourCount} attacks</strong>
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
