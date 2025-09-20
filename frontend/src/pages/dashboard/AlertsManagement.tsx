import React from 'react';
import { Bell } from 'lucide-react';

const AlertsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Bell className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">Alerts Management</h1>
        </div>
        <p className="text-gray-600">
          Alert configuration and notification management - Coming soon in full implementation...
        </p>
      </div>
    </div>
  );
};

export default AlertsManagement;
