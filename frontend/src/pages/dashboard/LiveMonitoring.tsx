import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, Shield, Zap } from 'lucide-react';
import { Attack } from '../../services/api';
import socketService from '../../services/socket';
import toast from 'react-hot-toast';

const LiveMonitoring: React.FC = () => {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState({
    totalToday: 0,
    lastMinute: 0,
    severity: { critical: 0, high: 0, medium: 0, low: 0 }
  });
  const attacksEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial connection status
    setIsConnected(socketService.connected);
    
    // Set up real-time listeners
    const unsubscribeAttacks = socketService.onNewAttack((attack) => {
      setAttacks(prev => [attack, ...prev.slice(0, 99)]); // Keep last 100 attacks
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalToday: prev.totalToday + 1,
        lastMinute: prev.lastMinute + 1,
        severity: {
          ...prev.severity,
          [attack.severity]: prev.severity[attack.severity] + 1
        }
      }));
      
      // Show notification
      toast.success(`🚨 ${attack.description}`, {
        duration: 3000,
        icon: '🚨'
      });
      
      // Auto-scroll to latest attack
      setTimeout(() => {
        attacksEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    const unsubscribeConnection = socketService.onConnectionChange(setIsConnected);

    // Reset last minute counter every minute
    const minuteInterval = setInterval(() => {
      setMetrics(prev => ({ ...prev, lastMinute: 0 }));
    }, 60000);

    return () => {
      unsubscribeAttacks();
      unsubscribeConnection();
      clearInterval(minuteInterval);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${
        isConnected 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <>
              <div className="h-3 w-3 bg-green-500 rounded-full pulse-dot"></div>
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Live Monitoring Active</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Connection Lost - Attempting to Reconnect</span>
            </>
          )}
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attacks Today</p>
              <p className="text-2xl font-bold text-red-600">{metrics.totalToday}</p>
            </div>
            <Shield className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Minute</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.lastMinute}</p>
            </div>
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{metrics.severity.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.severity.high}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Live Attack Feed */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Live Attack Feed</span>
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="h-2 w-2 bg-green-500 rounded-full pulse-dot"></div>
            <span>Real-time</span>
          </div>
        </div>

        <div className="h-96 overflow-y-auto custom-scrollbar space-y-3">
          {attacks.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Waiting for attack activity...</p>
              <p className="text-sm text-gray-500 mt-2">
                Try using the vulnerable application or click "Simulate Attack Wave" in the overview
              </p>
            </div>
          ) : (
            <>
              {attacks.map((attack, index) => (
                <div 
                  key={`${attack.id}-${index}`} 
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg fade-in"
                >
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getSeverityIcon(attack.severity)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(attack.severity)}`}>
                        {attack.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(attack.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="font-medium text-gray-900 mb-1">{attack.description}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Collection: <code className="bg-gray-200 px-1 rounded">{attack.collection}</code>
                    </p>
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View payload
                      </summary>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                        {attack.payload}
                      </div>
                    </details>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Blocked
                    </span>
                  </div>
                </div>
              ))}
              <div ref={attacksEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
