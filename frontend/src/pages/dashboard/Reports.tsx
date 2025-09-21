import React from 'react';
import { FileText } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Security Reports</h1>
        </div>
        <p className="text-gray-600">
          Generate and download security incident reports - Coming soon in full implementation...
        </p>
      </div>
    </div>
  );
};

export default Reports;
