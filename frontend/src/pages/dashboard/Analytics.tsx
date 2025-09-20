import React from 'react';
import { BarChart3 } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        </div>
        <p className="text-gray-600">
          Security analytics and attack pattern visualization - Coming soon in full implementation...
        </p>
      </div>
    </div>
  );
};

export default Analytics;
