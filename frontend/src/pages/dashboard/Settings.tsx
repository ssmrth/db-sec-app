import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bell, FileText, Cpu, Mail, Info } from 'lucide-react';
import { dashboardApi, settingsApi } from '../../services/api';
import toast from 'react-hot-toast';

interface SettingsState {
  emailNotifications: boolean;
  reportGeneration: boolean;
}

interface SystemInfo {
  apiUsageToday: number;
  apiUsageRemaining: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    reportGeneration: true
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load settings
      const settingsData = await settingsApi.getSettings();
      setSettings({
        emailNotifications: settingsData.settings.emailNotifications?.value ?? true,
        reportGeneration: settingsData.settings.reportGeneration?.value ?? true
      });
      
      // Load system info
      const metrics = await dashboardApi.getMetrics();
      setSystemInfo({
        apiUsageToday: metrics.apiUsageToday,
        apiUsageRemaining: metrics.apiUsageRemaining
      });
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      await Promise.all([
        settingsApi.updateSetting('emailNotifications', settings.emailNotifications, 'alerts', 'Enable/disable email notifications'),
        settingsApi.updateSetting('reportGeneration', settings.reportGeneration, 'reporting', 'Enable/disable automatic report generation')
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

  const handleToggle = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
          <p className="text-sm text-gray-400 mt-1">Manage notification and reporting settings</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="dashboard-card p-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Feature Toggles */}
          <div className="dashboard-card overflow-hidden">
            <div className="p-6 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">Feature Settings</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Email Alerts Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Email Alerts</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Send email notifications to configured recipients when attacks are detected
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* AI Reports Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">AI-Powered Reports</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Automatically generate PDF forensic reports using Gemini AI for each detected attack
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reportGeneration}
                    onChange={() => handleToggle('reportGeneration')}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* API Usage */}
          <div className="dashboard-card overflow-hidden">
            <div className="p-6 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Cpu className="h-5 w-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">Gemini API Usage</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Requests Today</p>
                  <p className="text-3xl font-bold text-white">{systemInfo?.apiUsageToday || 0}</p>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Remaining Today</p>
                  <p className="text-3xl font-bold text-green-500">{systemInfo?.apiUsageRemaining || 0}</p>
                </div>
              </div>
              
              {/* Usage Bar */}
              {systemInfo && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Daily Usage</span>
                    <span>{Math.round((systemInfo.apiUsageToday / (systemInfo.apiUsageToday + systemInfo.apiUsageRemaining)) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(systemInfo.apiUsageToday / (systemInfo.apiUsageToday + systemInfo.apiUsageRemaining)) * 100 || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="dashboard-card p-6 border border-blue-900/30 bg-blue-900/5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">How It Works</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  When a NoSQL injection attack is detected, the system will generate an AI-powered forensic report 
                  (if enabled) and send email alerts to all active recipients (if enabled). 
                  To manage alert recipients, visit the <span className="text-blue-400">Alerts</span> page.
                </p>
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
              <Info className="h-5 w-5 text-blue-200" />
              <span className="font-medium">You have unsaved changes</span>
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
