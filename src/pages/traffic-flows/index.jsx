import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const TrafficFlows = () => {
  const [flows, setFlows] = useState([
    { 
      id: 1, 
      name: 'Real Estate Leads - Moscow', 
      status: 'active', 
      leads: 1247, 
      conversion: 12.3, 
      revenue: 2847.50,
      source: 'Google Ads',
      created: '2025-01-15'
    },
    { 
      id: 2, 
      name: 'Auto Sales - SPB', 
      status: 'active', 
      leads: 856, 
      conversion: 8.7, 
      revenue: 1965.00,
      source: 'Yandex Direct',
      created: '2025-01-10'
    },
    { 
      id: 3, 
      name: 'Services - Regions', 
      status: 'paused', 
      leads: 432, 
      conversion: 15.2, 
      revenue: 987.30,
      source: 'Facebook Ads',
      created: '2025-01-08'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">Traffic Flows</h1>
            <p className="text-gray-600 text-sm">Manage and optimize your traffic campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium"
          >
            <Icon name="Plus" size={16} color="black" />
            <span>Create Flow</span>
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Flows</p>
                <p className="text-2xl font-bold text-black">12</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="GitBranch" size={16} color="#22C55E" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Leads</p>
                <p className="text-2xl font-bold text-black">8,547</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="Users" size={16} color="#3B82F6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Conversion</p>
                <p className="text-2xl font-bold text-black">11.8%</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={16} color="#F59E0B" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-black">$24,847</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="DollarSign" size={16} color="#8B5CF6" />
              </div>
            </div>
          </div>
        </div>

        {/* Flows Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">Traffic Flows</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search flows..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Icon name="Filter" size={16} color="#6B7280" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Flow Name</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Source</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Leads</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Conversion</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Revenue</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flows?.map((flow) => (
                  <tr key={flow?.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-black">{flow?.name}</p>
                        <p className="text-sm text-gray-600">Created: {flow?.created}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        flow?.status === 'active' ?'bg-green-100 text-green-800' :'bg-gray-100 text-gray-800'
                      }`}>
                        {flow?.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{flow?.source}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{flow?.leads?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{flow?.conversion}%</td>
                    <td className="px-3 py-3 text-sm font-medium text-green-600">${flow?.revenue?.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Icon name="Eye" size={16} color="#6B7280" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Icon name="Edit" size={16} color="#6B7280" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
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
      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Create New Traffic Flow</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} color="#6B7280" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flow Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter flow name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Traffic Source</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                  <option>Google Ads</option>
                  <option>Yandex Direct</option>
                  <option>Facebook Ads</option>
                  <option>TikTok Ads</option>
                  <option>VK Ads</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                  <option>Real Estate</option>
                  <option>Auto Sales</option>
                  <option>Services</option>
                  <option>Electronics</option>
                  <option>Other</option>
                </select>
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
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficFlows;