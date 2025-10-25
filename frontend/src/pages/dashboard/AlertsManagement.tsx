import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit2, Mail, Shield, User, Eye } from 'lucide-react';
import { alertsApi, AlertRecipient } from '../../services/api';
import toast from 'react-hot-toast';

const AlertsManagement: React.FC = () => {
  const [recipients, setRecipients] = useState<AlertRecipient[]>([]);
  const [loading, setLoading] = useState(true);
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
      setRecipients(data.recipients);
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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'security_analyst':
        return 'bg-thunderlarra-light text-thunderlarra-dark border-thunderlarra';
      case 'developer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-thunderlarra" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alerts Management</h1>
              <p className="text-sm text-gray-600">Manage email recipients and notification preferences</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-thunderlarra text-white px-4 py-2 rounded-md hover:bg-thunderlarra-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Recipient</span>
          </button>
        </div>
      </div>

      {/* Recipients List */}
      <div className="dashboard-card rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Recipients</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thunderlarra mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading recipients...</p>
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No recipients configured</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-thunderlarra text-white px-4 py-2 rounded-md hover:bg-thunderlarra-dark transition-colors"
            >
              Add First Recipient
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recipients.map((recipient) => (
              <div
                key={recipient._id}
                className={`border rounded-lg p-4 ${
                  recipient.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{recipient.name}</h3>
                      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(recipient.role)}`}>
                        {getRoleIcon(recipient.role)}
                        <span>{recipient.role.replace('_', ' ')}</span>
                      </span>
                      {!recipient.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      <Mail className="inline h-4 w-4 mr-1" />
                      {recipient.email}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {recipient.permissions.receiveAlerts && (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          ✓ Receive Alerts
                        </span>
                      )}
                      {recipient.permissions.viewReports && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          ✓ View Reports
                        </span>
                      )}
                      {recipient.permissions.manageAlerts && (
                        <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                          ✓ Manage Alerts
                        </span>
                      )}
                      {recipient.permissions.manageSettings && (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                          ✓ Manage Settings
                        </span>
                      )}
                    </div>
                    
                    {recipient.lastNotified && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last notified: {new Date(recipient.lastNotified).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(recipient)}
                      className={`px-3 py-1 rounded text-sm ${
                        recipient.isActive
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-200 text-green-700 hover:bg-green-300'
                      }`}
                    >
                      {recipient.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEditModal(recipient)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecipient(recipient._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingRecipient) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={editingRecipient ? handleUpdateRecipient : handleAddRecipient}>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingRecipient ? 'Edit Recipient' : 'Add New Recipient'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="developer">Developer</option>
                      <option value="security_analyst">Security Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Role determines default permissions
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.receiveAlerts}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, receiveAlerts: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-thunderlarra focus:ring-thunderlarra"
                        />
                        <span className="text-sm text-gray-700">Receive email alerts</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.viewReports}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, viewReports: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-thunderlarra focus:ring-thunderlarra"
                        />
                        <span className="text-sm text-gray-700">View security reports</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageAlerts}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, manageAlerts: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-thunderlarra focus:ring-thunderlarra"
                        />
                        <span className="text-sm text-gray-700">Manage alert recipients</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.manageSettings}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, manageSettings: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-thunderlarra focus:ring-thunderlarra"
                        />
                        <span className="text-sm text-gray-700">Manage system settings</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingRecipient(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-thunderlarra text-white rounded-md hover:bg-thunderlarra-dark"
                  >
                    {editingRecipient ? 'Update Recipient' : 'Add Recipient'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManagement;
