import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <SettingsIcon className="h-6 w-6 text-gray-500" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">
          System configuration and monitoring settings - Coming soon in full implementation...
        </p>
      </div>
    </div>
  );
};

export default Settings;
