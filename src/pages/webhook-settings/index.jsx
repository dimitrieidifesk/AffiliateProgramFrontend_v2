import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const WebhookSettings = () => {
  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      name: 'CRM Integration',
      url: 'https://api.mycrm.com/webhook/leads',
      events: ['lead.created', 'lead.updated'],
      status: 'active',
      lastTrigger: '2025-01-20 14:23:15',
      success: 98.7
    },
    {
      id: 2,
      name: 'Analytics System',
      url: 'https://analytics.example.com/webhook',
      events: ['lead.created', 'conversion.completed'],
      status: 'active',
      lastTrigger: '2025-01-20 14:15:42',
      success: 100.0
    },
    {
      id: 3,
      name: 'Email Notifications',
      url: 'https://mail.service.com/webhook/notify',
      events: ['lead.qualified'],
      status: 'error',
      lastTrigger: '2025-01-19 09:12:33',
      success: 45.2
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(null);

  const eventTypes = [
    { value: 'lead.created', label: 'Lead Created', description: 'Triggered when a new lead is generated' },
    { value: 'lead.updated', label: 'Lead Updated', description: 'Triggered when lead data is modified' },
    { value: 'lead.qualified', label: 'Lead Qualified', description: 'Triggered when a lead meets qualification criteria' },
    { value: 'conversion.completed', label: 'Conversion Completed', description: 'Triggered when a lead converts' },
    { value: 'payout.calculated', label: 'Payout Calculated', description: 'Triggered when earnings are calculated' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">Webhook Settings</h1>
            <p className="text-gray-600 text-sm">Configure webhook integrations for real-time data sync</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium"
          >
            <Icon name="Plus" size={16} color="black" />
            <span>Add Webhook</span>
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Webhooks</p>
                <p className="text-2xl font-bold text-black">8</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Webhook" size={16} color="#22C55E" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-black">12,547</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="Activity" size={16} color="#3B82F6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-black">94.8%</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="CheckCircle" size={16} color="#8B5CF6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Failed Today</p>
                <p className="text-2xl font-bold text-black">12</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Icon name="AlertCircle" size={16} color="#EF4444" />
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">Configured Webhooks</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search webhooks..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Icon name="RefreshCw" size={16} color="#6B7280" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Endpoint URL</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Events</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Success Rate</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Last Trigger</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {webhooks?.map((webhook) => (
                  <tr key={webhook?.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <p className="font-medium text-black">{webhook?.name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-sm text-blue-600 truncate max-w-64">{webhook?.url}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {webhook?.events?.map((event, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-medium ${
                        webhook?.success > 95 ? 'text-green-600' : 
                        webhook?.success > 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {webhook?.success}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{webhook?.lastTrigger}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        webhook?.status === 'active' ?'bg-green-100 text-green-800' 
                          : webhook?.status === 'error' ?'bg-red-100 text-red-800' :'bg-gray-100 text-gray-800'
                      }`}>
                        {webhook?.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowTestModal(webhook?.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Test webhook"
                        >
                          <Icon name="Play" size={16} color="#6B7280" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="View logs">
                          <Icon name="FileText" size={16} color="#6B7280" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                          <Icon name="Edit" size={16} color="#6B7280" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="More">
                          <Icon name="MoreVertical" size={16} color="#6B7280" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Add New Webhook</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} color="#6B7280" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter webhook name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="https://your-service.com/webhook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events to Subscribe</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {eventTypes?.map((event) => (
                    <div key={event?.value} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={event?.value}
                        className="mt-1 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                      />
                      <label htmlFor={event?.value} className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{event?.label}</div>
                        <div className="text-xs text-gray-500">{event?.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key (Optional)</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter secret for signature verification..."
                />
                <p className="text-xs text-gray-500 mt-1">Used for webhook payload verification</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Activate webhook immediately
                </label>
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium"
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Test Webhook Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Test Webhook</h2>
              <button
                onClick={() => setShowTestModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} color="#6B7280" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Event</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                  <option>lead.created</option>
                  <option>lead.updated</option>
                  <option>conversion.completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Payload</label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-mono text-sm"
                  defaultValue={`{
  "event": "lead.created",
  "data": {
    "id": 12345,
    "email": "test@example.com",
    "source": "google-ads",
    "created_at": "2025-01-20T14:23:15Z"
  }
}`}
                />
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTestModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium"
                >
                  Send Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookSettings;