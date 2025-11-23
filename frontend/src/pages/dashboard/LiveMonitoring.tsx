import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, Shield, Zap, Radio, Terminal } from 'lucide-react';
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
      toast.success(`Blocked: ${attack.description}`, {
        icon: '🛡️',
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #334155'
        }
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
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Live Threat Monitor
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time packet inspection and threat blocking</p>
        </div>
        
        <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${
          isConnected 
            ? 'bg-green-900/20 border-green-900/30 text-green-400' 
            : 'bg-red-900/20 border-red-900/30 text-red-400'
        }`}>
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`}></div>
          <span className="font-mono text-sm font-medium uppercase tracking-wider">
            {isConnected ? 'System Active' : 'Connection Lost'}
          </span>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card p-5 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Attacks Today</p>
              <p className="text-3xl font-bold text-white">{metrics.totalToday}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500/50" />
          </div>
        </div>

        <div className="dashboard-card p-5 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Last Minute</p>
              <p className="text-3xl font-bold text-purple-400">{metrics.lastMinute}</p>
            </div>
            <Zap className="h-8 w-8 text-purple-500/50" />
          </div>
        </div>

        <div className="dashboard-card p-5 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Critical Threats</p>
              <p className="text-3xl font-bold text-red-500">{metrics.severity.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500/50" />
          </div>
        </div>

        <div className="dashboard-card p-5 border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">High Risk</p>
              <p className="text-3xl font-bold text-orange-500">{metrics.severity.high}</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500/50" />
          </div>
        </div>
      </div>

      {/* Live Attack Feed */}
      <div className="dashboard-card flex flex-col h-[600px]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-gray-400" />
            Incoming Traffic Log
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Radio className="h-3 w-3 text-red-500 animate-pulse" />
            LIVE STREAM
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B1120] font-mono custom-scrollbar">
          {attacks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <Shield className="h-12 w-12 mb-4 opacity-20" />
              <p>Waiting for traffic analysis...</p>
              <p className="text-sm mt-2 text-gray-700">System is scanning for injection patterns</p>
            </div>
          ) : (
            <>
              {attacks.map((attack, index) => (
                <div 
                  key={`${attack.id}-${index}`} 
                  className="group relative p-3 rounded bg-gray-800/30 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 transition-all fade-in"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`h-2 w-2 rounded-full ${
                        attack.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' :
                        attack.severity === 'high' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' :
                        'bg-yellow-500'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-gray-500 text-xs">{new Date(attack.timestamp).toLocaleTimeString()}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityColor(attack.severity)}`}>
                          {attack.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-blue-400">Source: {attack.collection}</span>
                      </div>
                      
                      <p className="text-gray-300 text-sm font-medium">{attack.description}</p>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="bg-black/30 p-2 rounded border border-gray-800/50">
                          <p className="text-[10px] text-gray-500 uppercase">Target Collection</p>
                          <p className="text-xs text-gray-300">{attack.collection}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded border border-gray-800/50 group-hover:bg-black/50 transition-colors">
                          <p className="text-[10px] text-gray-500 uppercase">Payload</p>
                          <p className="text-xs text-red-300 break-all font-mono">{attack.payload}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 self-center">
                      <div className="border border-green-500/30 bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold">
                        BLOCKED
                      </div>
                    </div>
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
