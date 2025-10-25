import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Database, Mail, Clock } from 'lucide-react';
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
      
      toast.success('Settings saved successfully');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-6 w-6 text-thunderlarra" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-sm text-gray-600">Configure monitoring, alerts, and security preferences</p>
            </div>
          </div>
          {hasChanges && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 bg-thunderlarra text-white px-4 py-2 rounded-md hover:bg-thunderlarra-dark transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="dashboard-card rounded-lg p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thunderlarra mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading settings...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Monitoring Settings */}
          <div className="dashboard-card rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-thunderlarra" />
              <h2 className="text-lg font-semibold text-gray-900">Monitoring & Security</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="font-medium text-gray-900">Real-time Monitoring</h3>
                  <p className="text-sm text-gray-600">Enable continuous database monitoring for threats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.monitoringEnabled}
                    onChange={(e) => handleSettingChange('monitoringEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thunderlarra-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thunderlarra"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="font-medium text-gray-900">Auto-block Attacks</h3>
                  <p className="text-sm text-gray-600">Automatically block detected malicious queries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoBlock}
                    onChange={(e) => handleSettingChange('autoBlock', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thunderlarra-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thunderlarra"></div>
                </label>
              </div>
              
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">Alert Threshold</h3>
                    <p className="text-sm text-gray-600">Number of attacks before triggering alert</p>
                  </div>
                  <span className="text-2xl font-bold text-thunderlarra">{settings.alertThreshold}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={settings.alertThreshold}
                  onChange={(e) => handleSettingChange('alertThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-thunderlarra"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 attack</span>
                  <span>20 attacks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="dashboard-card rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="h-5 w-5 text-thunderlarra" />
              <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Send email alerts to configured recipients</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thunderlarra-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thunderlarra"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-gray-900">AI Report Generation</h3>
                  <p className="text-sm text-gray-600">Automatically generate detailed security reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reportGeneration}
                    onChange={(e) => handleSettingChange('reportGeneration', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thunderlarra-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thunderlarra"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="dashboard-card rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="h-5 w-5 text-thunderlarra" />
              <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
            </div>
            
            <div className="space-y-4">
              <div className="py-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">Log Retention Period</h3>
                    <p className="text-sm text-gray-600">Days to keep attack logs in database</p>
                  </div>
                  <span className="text-2xl font-bold text-thunderlarra">{settings.retentionDays} days</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="365"
                  step="7"
                  value={settings.retentionDays}
                  onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-thunderlarra"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>7 days</span>
                  <span>365 days</span>
                </div>
              </div>
              
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">API Rate Limit (Daily)</h3>
                    <p className="text-sm text-gray-600">Maximum Gemini API requests per day</p>
                  </div>
                  <span className="text-2xl font-bold text-thunderlarra">{settings.apiRateLimit}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-thunderlarra"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100 requests</span>
                  <span>2000 requests</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="dashboard-card rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <SettingsIcon className="h-5 w-5 text-thunderlarra" />
              <h2 className="text-lg font-semibold text-gray-900">Advanced</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-gray-900">Debug Mode</h3>
                  <p className="text-sm text-gray-600">Enable detailed logging for troubleshooting</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thunderlarra-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thunderlarra"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button (Fixed at bottom) */}
          {hasChanges && (
            <div className="dashboard-card rounded-lg p-4 bg-thunderlarra-light border-2 border-thunderlarra">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  You have unsaved changes
                </p>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-thunderlarra text-white px-6 py-2 rounded-md hover:bg-thunderlarra-dark transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Settings;
