import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit2, Mail, Shield, User, Eye, X, FileText, Settings } from 'lucide-react';
import { alertsApi, AlertRecipient } from '../../services/api';
import toast from 'react-hot-toast';

const AlertsManagement: React.FC = () => {
  const [recipients, setRecipients] = useState<AlertRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManageAlerts, setCanManageAlerts] = useState(true); // Default to true for initial setup
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<AlertRecipient | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'viewer' as 'admin' | 'security_analyst' | 'developer' | 'viewer',
    permissions: {
      receiveAlerts: true,
      viewReports: true,
      manageAlerts: false,
      manageSettings: false
    }
  });

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const data = await alertsApi.getRecipients();
      setRecipients(Array.isArray(data.recipients) ? data.recipients : []);
      
      // Check permissions
      try {
        const permissions = await alertsApi.checkPermissions();
        setCanManageAlerts(permissions.canManageAlerts);
      } catch (permError) {
        // If no recipients exist yet, allow management
        setCanManageAlerts((data.recipients || []).length === 0);
      }
    } catch (error: any) {
      toast.error('Failed to load recipients');
      console.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await alertsApi.addRecipient(formData);
      toast.success('Recipient added successfully');
      setShowAddModal(false);
      resetForm();
      loadRecipients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add recipient');
    }
  };

  const handleUpdateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipient) return;

    try {
      await alertsApi.updateRecipient(editingRecipient._id, formData);
      toast.success('Recipient updated successfully');
      setEditingRecipient(null);
      resetForm();
      loadRecipients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update recipient');
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recipient?')) return;

    try {
      await alertsApi.deleteRecipient(id);
      toast.success('Recipient deleted successfully');
      loadRecipients();
    } catch (error: any) {
      toast.error('Failed to delete recipient');
    }
  };

  const handleToggleActive = async (recipient: AlertRecipient) => {
    try {
      await alertsApi.updateRecipient(recipient._id, {
        isActive: !recipient.isActive
      });
      toast.success(`Recipient ${!recipient.isActive ? 'activated' : 'deactivated'}`);
      loadRecipients();
    } catch (error: any) {
      toast.error('Failed to update recipient status');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'viewer',
      permissions: {
        receiveAlerts: true,
        viewReports: true,
        manageAlerts: false,
        manageSettings: false
      }
    });
  };

  const openEditModal = (recipient: AlertRecipient) => {
    setFormData({
      email: recipient.email,
      name: recipient.name,
      role: recipient.role,
      permissions: recipient.permissions
    });
    setEditingRecipient(recipient);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'security_analyst':
        return <Eye className="h-4 w-4" />;
      case 'developer':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'security_analyst':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'developer':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          receiveAlerts: true,
          viewReports: true,
          manageAlerts: true,
          manageSettings: true
        };
      case 'security_analyst':
        return {
          receiveAlerts: true,
          viewReports: true,
          manageAlerts: true,
          manageSettings: false
        };
      case 'developer':
        return {
          receiveAlerts: true,
          viewReports: true,
          manageAlerts: false,
          manageSettings: false
        };
      default:
        return {
          receiveAlerts: true,
          viewReports: true,
          manageAlerts: false,
          manageSettings: false
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-orange-500" />
            Alert Distribution
          </h1>
          <p className="text-sm text-gray-400 mt-1">Configure notification routing and access controls</p>
        </div>
        {canManageAlerts && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>New Recipient</span>
          </button>
        )}
      </div>

      {/* Recipients List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="dashboard-card p-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (recipients || []).length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No alert recipients configured</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Add your first recipient
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recipients || []).map((recipient) => (
              <div
                key={recipient._id}
                className={`dashboard-card p-6 relative group border transition-all duration-200 ${
                  recipient.isActive ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800 opacity-60 bg-gray-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getRoleColor(recipient.role)}`}>
                      {getRoleIcon(recipient.role)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{recipient.name}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {recipient.email}
                      </p>
                    </div>
                  </div>
                  {canManageAlerts && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(recipient)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipient(recipient._id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {recipient.permissions.receiveAlerts && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      <Bell className="h-3 w-3" />
                      Receive Alerts
                    </span>
                  )}
                  {recipient.permissions.viewReports && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <FileText className="h-3 w-3" />
                      View Reports
                    </span>
                  )}
                  {recipient.permissions.manageAlerts && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      <Shield className="h-3 w-3" />
                      Manage Alerts
                    </span>
                  )}
                  {recipient.permissions.manageSettings && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                      <Settings className="h-3 w-3" />
                      Manage Settings
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                   <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoleColor(recipient.role)}`}>
                    {recipient.role.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  <button
                    onClick={() => handleToggleActive(recipient)}
                    className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                      recipient.isActive
                        ? 'border-green-500/30 text-green-500 bg-green-500/10 hover:bg-green-500/20'
                        : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {recipient.isActive ? 'Active Account' : 'Activate Account'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingRecipient) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingRecipient ? 'Edit Recipient' : 'Add New Recipient'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRecipient(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={editingRecipient ? handleUpdateRecipient : handleAddRecipient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sarah@cyberdyne.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Role Assignment</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const role = e.target.value as any;
                    setFormData({
                      ...formData,
                      role,
                      permissions: getRolePermissions(role)
                    });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer (Read Only)</option>
                  <option value="developer">Developer</option>
                  <option value="security_analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Permissions</p>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.permissions.receiveAlerts}
                    onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, receiveAlerts: e.target.checked }})}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span>Receive Alerts</span>
                  <span className="text-xs text-green-400 ml-2">✓ Controls email delivery</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.permissions.viewReports}
                    onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, viewReports: e.target.checked }})}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span>View Reports</span>
                  <span className="text-xs text-blue-400 ml-2">✓ Controls report access</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.permissions.manageAlerts}
                    onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, manageAlerts: e.target.checked }})}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span>Manage Alerts</span>
                  <span className="text-xs text-orange-400 ml-2">✓ Controls recipient management</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.permissions.manageSettings}
                    onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, manageSettings: e.target.checked }})}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span>Manage Settings</span>
                  <span className="text-xs text-gray-500 ml-2">(Reserved for future use)</span>
                </label>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                  <strong>Note:</strong> Recipients must be active and have "Receive Alerts" enabled to receive email notifications. 
                  At least one active recipient with "View Reports" is required to access reports. 
                  At least one active recipient with "Manage Alerts" is required to manage recipients.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
              >
                {editingRecipient ? 'Update Recipient' : 'Create Recipient'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManagement;
