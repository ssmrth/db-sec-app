import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Clock,
  Database,
  Target,
  Zap,
  FileText,
  Bell,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { dashboardApi, DashboardMetrics, Attack } from '../../services/api';
import { demoApi } from '../../services/api';
import socketService from '../../services/socket';
import toast from 'react-hot-toast';

const OverviewDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAttacks, setRecentAttacks] = useState<Attack[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatingAttacks, setSimulatingAttacks] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const unsubscribeAttacks = socketService.onNewAttack((attack) => {
      setRecentAttacks(prev => [attack, ...prev.slice(0, 4)]);
      toast.success(`New threat blocked: ${attack.description}`, {
        icon: '🛡️',
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #334155'
        }
      });
    });

    const unsubscribeMetrics = socketService.onMetricsUpdate((newMetrics) => {
      setMetrics(prev => prev ? { ...prev, ...newMetrics } : null);
    });

    return () => {
      unsubscribeAttacks();
      unsubscribeMetrics();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsData, attacksData] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getRecentAttacks(5)
      ]);
      
      setMetrics(metricsData);
      setRecentAttacks(attacksData.attacks);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const simulateAttackWave = async () => {
    setSimulatingAttacks(true);
    toast.loading('Initiating attack simulation sequence...', { id: 'sim-attack' });
    
    try {
      await demoApi.simulateAttackWave();
      toast.success('Attack simulation completed successfully', { id: 'sim-attack' });
    } catch (error) {
      console.error('Error simulating attacks:', error);
      toast.error('Simulation failed', { id: 'sim-attack' });
    } finally {
      setSimulatingAttacks(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl h-40"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gray-800/50 rounded-xl h-96"></div>
          <div className="bg-gray-800/50 rounded-xl h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="h-24 w-24 text-red-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Threats Today</p>
            </div>
            <p className="text-4xl font-bold text-white mt-2">{metrics?.attacksToday || 0}</p>
            <div className="mt-4 flex items-center text-sm text-red-400 font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+{metrics?.recentAttacksCount || 0} in last hour</span>
            </div>
          </div>
        </div>

        <div className="metric-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="h-24 w-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Blocked</p>
            </div>
            <p className="text-4xl font-bold text-white mt-2">{metrics?.totalAttacks || 0}</p>
            <div className="mt-4 flex items-center text-sm text-blue-400 font-medium">
              <Database className="h-4 w-4 mr-1" />
              <span>All-time protection</span>
            </div>
          </div>
        </div>

        <div className="metric-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-24 w-24 text-green-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">System Health</p>
            </div>
            <div className="mt-3">
              <span className={`text-lg font-bold px-4 py-1.5 rounded-full border ${getHealthColor(metrics?.systemHealth || 'healthy')}`}>
                {metrics?.systemHealth?.toUpperCase() || 'OPERATIONAL'}
              </span>
            </div>
            <div className="mt-5 flex items-center text-sm text-green-400 font-medium">
              <Zap className="h-4 w-4 mr-1" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>

        <div className="metric-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="h-24 w-24 text-purple-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Cpu className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">AI Engine Usage</p>
            </div>
            <p className="text-4xl font-bold text-white mt-2">{metrics?.apiUsageToday || 0}</p>
            <div className="mt-4 flex items-center text-sm text-purple-400 font-medium">
              <Clock className="h-4 w-4 mr-1" />
              <span>{metrics?.apiUsageRemaining || 0} requests remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attacks Feed */}
        <div className="lg:col-span-2 dashboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Target className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Threat Intelligence Feed</h3>
                <p className="text-sm text-gray-400">Real-time injection attempts blocked</p>
              </div>
            </div>
            <Link
              to="/dashboard/live"
              className="flex items-center text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Live Monitor <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAttacks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl bg-gray-800/30">
                <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No threats detected recently</p>
                <p className="text-sm text-gray-500 mt-1">System is secure and monitoring</p>
              </div>
            ) : (
              recentAttacks.map((attack) => (
                <div key={attack.id} className="group flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      attack.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                      attack.severity === 'high' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' :
                      'bg-yellow-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          attack.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          attack.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {attack.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 font-mono">
                          {new Date(attack.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white font-medium mt-1 group-hover:text-blue-400 transition-colors">{attack.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Target: <span className="text-gray-400 font-mono">{attack.collection}</span></p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center space-x-2 bg-green-900/20 px-3 py-1 rounded-lg border border-green-900/30">
                      <Shield className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-400">BLOCKED</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions & Quick Links */}
        <div className="space-y-6">
          {/* Control Center */}
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Control Center</h3>
            <div className="space-y-3">
              <button
                onClick={simulateAttackWave}
                disabled={simulatingAttacks}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-3 rounded-lg font-semibold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Target className="h-5 w-5" />
                <span>{simulatingAttacks ? 'Simulation in Progress...' : 'Simulate Attack Wave'}</span>
              </button>
              
              <Link
                to="/vulnerable"
                target="_blank"
                className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg font-medium border border-gray-700 transition-all"
              >
                <Shield className="h-5 w-5 text-purple-500" />
                <span>Launch Vulnerable App</span>
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Navigation</h4>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/dashboard/analytics" className="flex flex-col items-center p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 transition-all group">
                  <TrendingUp className="h-6 w-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-300">Analytics</span>
                </Link>
                <Link to="/dashboard/reports" className="flex flex-col items-center p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 transition-all group">
                  <FileText className="h-6 w-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-300">Reports</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* System Status Mini */}
          <div className="dashboard-card p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-5 w-5 text-blue-500" />
              <h3 className="font-bold text-white">System Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Engine Status</span>
                <span className="text-green-400 font-medium flex items-center"><div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Last Update</span>
                <span className="text-white font-mono text-xs">Just now</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
