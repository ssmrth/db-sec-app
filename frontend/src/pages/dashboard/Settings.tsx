import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Database, Terminal, AlertTriangle } from 'lucide-react';
import { settingsApi, SystemSetting } from '../../services/api';
import toast from 'react-hot-toast';

interface SettingsState {
  monitoringEnabled: boolean;
  alertThreshold: number;
  emailNotifications: boolean;
  reportGeneration: boolean;
  autoBlock: boolean;
  retentionDays: number;
  apiRateLimit: number;
  debugMode: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    monitoringEnabled: true,
    alertThreshold: 5,
    emailNotifications: true,
    reportGeneration: true,
    autoBlock: true,
    retentionDays: 90,
    apiRateLimit: 1400,
    debugMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getSettings();
      
      // Map backend settings to frontend state
      const mappedSettings: SettingsState = {
        monitoringEnabled: data.settings.monitoringEnabled?.value ?? true,
        alertThreshold: data.settings.alertThreshold?.value ?? 5,
        emailNotifications: data.settings.emailNotifications?.value ?? true,
        reportGeneration: data.settings.reportGeneration?.value ?? true,
        autoBlock: data.settings.autoBlock?.value ?? true,
        retentionDays: data.settings.retentionDays?.value ?? 90,
        apiRateLimit: data.settings.apiRateLimit?.value ?? 1400,
        debugMode: data.settings.debugMode?.value ?? false
      };
      
      setSettings(mappedSettings);
    } catch (error: any) {
      toast.error('Failed to load settings');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Save each setting individually
      await Promise.all([
        settingsApi.updateSetting('monitoringEnabled', settings.monitoringEnabled, 'monitoring', 'Enable/disable real-time monitoring'),
        settingsApi.updateSetting('alertThreshold', settings.alertThreshold, 'alerts', 'Number of attacks before triggering alert'),
        settingsApi.updateSetting('emailNotifications', settings.emailNotifications, 'alerts', 'Enable/disable email notifications'),
        settingsApi.updateSetting('reportGeneration', settings.reportGeneration, 'reporting', 'Enable/disable automatic report generation'),
        settingsApi.updateSetting('autoBlock', settings.autoBlock, 'security', 'Automatically block detected attacks'),
        settingsApi.updateSetting('retentionDays', settings.retentionDays, 'general', 'Number of days to retain attack logs'),
        settingsApi.updateSetting('apiRateLimit', settings.apiRateLimit, 'general', 'Daily API rate limit for Gemini'),
        settingsApi.updateSetting('debugMode', settings.debugMode, 'general', 'Enable debug logging')
      ]);
      
      toast.success('System configuration updated');
      setHasChanges(false);
    } catch (error: any) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-gray-400" />
            System Configuration
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage security policies and system behavior</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium animate-pulse"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Applying...' : 'Save Changes'}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="dashboard-card p-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Policies */}
          <div className="dashboard-card overflow-hidden">
            <div className="p-6 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">Security Policies</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Real-time Monitoring</h3>
                  <p className="text-sm text-gray-400">Active packet inspection engine</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.monitoringEnabled}
                    onChange={(e) => handleSettingChange('monitoringEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Auto-Block Threats</h3>
                  <p className="text-sm text-gray-400">Instantly block detected malicious payloads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoBlock}
                    onChange={(e) => handleSettingChange('autoBlock', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-white">Alert Threshold</h3>
                    <p className="text-sm text-gray-400">Incidents before triggering critical alert</p>
                  </div>
                  <span className="text-xl font-bold text-blue-500">{settings.alertThreshold}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={settings.alertThreshold}
                  onChange={(e) => handleSettingChange('alertThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                  <span>1 (Sensitive)</span>
                  <span>20 (Relaxed)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications & Reporting */}
          <div className="dashboard-card overflow-hidden">
            <div className="p-6 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">Notifications & AI</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Email Alerts</h3>
                  <p className="text-sm text-gray-400">Send security bulletins to admins</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Automated Reporting</h3>
                  <p className="text-sm text-gray-400">Generate PDF forensic reports via AI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reportGeneration}
                    onChange={(e) => handleSettingChange('reportGeneration', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* System Limits */}
          <div className="dashboard-card overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Database className="h-5 w-5 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">System Limits</h2>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-white">Log Retention</h3>
                    <p className="text-sm text-gray-400">Days to store raw attack data</p>
                  </div>
                  <span className="text-xl font-bold text-green-500">{settings.retentionDays}d</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="365"
                  step="7"
                  value={settings.retentionDays}
                  onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                  <span>7 days</span>
                  <span>1 year</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-white">API Rate Limit</h3>
                    <p className="text-sm text-gray-400">Daily Gemini AI tokens</p>
                  </div>
                  <span className="text-xl font-bold text-green-500">{settings.apiRateLimit}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                  <span>100 reqs</span>
                  <span>2000 reqs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced */}
          <div className="dashboard-card overflow-hidden lg:col-span-2 border border-red-900/30">
            <div className="p-6 border-b border-gray-800 bg-red-900/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Terminal className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">Advanced Configuration</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white flex items-center gap-2">
                    Debug Mode
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-xs border border-red-500/20 font-bold uppercase">Caution</span>
                  </h3>
                  <p className="text-sm text-gray-400">Enable verbose logging for troubleshooting. Performance impact.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Float */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 left-64 z-50">
          <div className="max-w-3xl mx-auto bg-blue-600 rounded-xl shadow-2xl shadow-blue-900/50 p-4 flex items-center justify-between border border-blue-400/30 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-white">
              <AlertTriangle className="h-5 w-5 text-blue-200" />
              <span className="font-medium">You have unsaved configuration changes</span>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
