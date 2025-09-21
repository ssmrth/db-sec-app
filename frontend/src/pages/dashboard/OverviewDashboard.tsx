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
  Bell
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
      toast.success(`🚨 New attack detected: ${attack.description}`);
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
    toast('🎯 Simulating attack wave...', { icon: '🎯' });
    
    try {
      await demoApi.simulateAttackWave();
      toast.success('✅ Attack simulation completed');
    } catch (error) {
      console.error('Error simulating attacks:', error);
      toast.error('Attack simulation failed');
    } finally {
      setSimulatingAttacks(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-card rounded-lg p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attacks Today</p>
              <p className="text-3xl font-bold text-red-600">{metrics?.attacksToday || 0}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>Last hour: {metrics?.recentAttacksCount || 0}</span>
          </div>
        </div>

        <div className="metric-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attacks</p>
              <p className="text-3xl font-bold text-orange-600">{metrics?.totalAttacks || 0}</p>
            </div>
            <Shield className="h-12 w-12 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Database className="h-4 w-4 mr-1" />
            <span>All time detected</span>
          </div>
        </div>

        <div className="metric-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className={`text-lg font-bold px-3 py-1 rounded-full ${getHealthColor(metrics?.systemHealth || 'healthy')}`}>
                {metrics?.systemHealth?.toUpperCase() || 'HEALTHY'}
              </p>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Zap className="h-4 w-4 mr-1" />
            <span>Real-time monitoring</span>
          </div>
        </div>

        <div className="metric-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Usage</p>
              <p className="text-3xl font-bold text-blue-600">{metrics?.apiUsageToday || 0}</p>
            </div>
            <Target className="h-12 w-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Remaining: {metrics?.apiUsageRemaining || 0}</span>
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Demo Controls</h3>
          <div className="flex space-x-3">
            <button
              onClick={simulateAttackWave}
              disabled={simulatingAttacks}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors"
            >
              {simulatingAttacks ? 'Simulating...' : '🎯 Simulate Attack Wave'}
            </button>
            <Link
              to="/vulnerable"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              🔍 Test Vulnerabilities
            </Link>
          </div>
        </div>
        <p className="text-gray-600">
          Use these controls to demonstrate the security monitoring system. The attack simulation will trigger multiple 
          NoSQL injection attempts that will be detected and logged in real-time.
        </p>
      </div>

      {/* Recent Attacks */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Attack Activity</h3>
          <Link
            to="/dashboard/live"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Live Monitor →
          </Link>
        </div>

        {recentAttacks.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No attacks detected yet</p>
            <p className="text-sm text-gray-500 mt-1">Try using the vulnerable application to generate attacks</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAttacks.map((attack, index) => (
              <div key={attack.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg fade-in">
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(attack.severity)}`}>
                    {attack.severity.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{attack.description}</p>
                    <p className="text-sm text-gray-600">Collection: {attack.collection}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{new Date(attack.timestamp).toLocaleTimeString()}</p>
                  <p className="text-xs text-gray-500">Blocked</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/dashboard/analytics" className="dashboard-card rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <h4 className="font-semibold text-gray-900">Analytics</h4>
              <p className="text-sm text-gray-600">View attack trends and patterns</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/reports" className="dashboard-card rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <h4 className="font-semibold text-gray-900">Reports</h4>
              <p className="text-sm text-gray-600">Generate security reports</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/alerts" className="dashboard-card rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-orange-500" />
            <div>
              <h4 className="font-semibold text-gray-900">Alerts</h4>
              <p className="text-sm text-gray-600">Manage alert settings</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default OverviewDashboard;
