import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const LeadDatabase = () => {
  const [leads, setLeads] = useState([
    {
      id: 1,
      name: 'Алексей Иванов',
      email: 'alexey.ivanov@mail.ru',
      phone: '+7 (999) 123-45-67',
      source: 'Google Ads',
      flow: 'Real Estate Moscow',
      status: 'qualified',
      created: '2025-01-20 14:23:15',
      city: 'Moscow',
      budget: '5,000,000 RUB'
    },
    {
      id: 2,
      name: 'Мария Петрова',
      email: 'maria.petrova@gmail.com',
      phone: '+7 (905) 987-65-43',
      source: 'Yandex Direct',
      flow: 'Auto Sales SPB',
      status: 'new',
      created: '2025-01-20 13:15:42',
      city: 'St. Petersburg',
      budget: '1,200,000 RUB'
    },
    {
      id: 3,
      name: 'Дмитрий Сидоров',
      email: 'dmitry.s@yandex.ru',
      phone: '+7 (916) 555-12-34',
      source: 'Facebook Ads',
      flow: 'Services Regional',
      status: 'contacted',
      created: '2025-01-20 11:08:29',
      city: 'Kazan',
      budget: '250,000 RUB'
    }
  ]);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev?.includes(leadId) 
        ? prev?.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    setSelectedLeads(
      selectedLeads?.length === leads?.length 
        ? [] 
        : leads?.map(lead => lead?.id)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return 'User';
      case 'contacted': return 'Phone';
      case 'qualified': return 'CheckCircle';
      case 'converted': return 'Star';
      case 'rejected': return 'X';
      default: return 'Circle';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">Lead Database</h1>
            <p className="text-gray-600 text-sm">Browse and manage all generated leads</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-medium ${
                showFilters 
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name="Filter" size={16} color={showFilters ? '#92400E' : '#374151'} />
              <span>Filters</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium"
            >
              <Icon name="Download" size={16} color="black" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Statuses</option>
                <option>New</option>
                <option>Contacted</option>
                <option>Qualified</option>
                <option>Converted</option>
                <option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Sources</option>
                <option>Google Ads</option>
                <option>Yandex Direct</option>
                <option>Facebook Ads</option>
                <option>VK Ads</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Flow</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Flows</option>
                <option>Real Estate Moscow</option>
                <option>Auto Sales SPB</option>
                <option>Services Regional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Custom range</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
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
                <p className="text-gray-600 text-sm">Qualified Leads</p>
                <p className="text-2xl font-bold text-black">2,847</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="CheckCircle" size={16} color="#22C55E" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold text-black">33.3%</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={16} color="#8B5CF6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Lead Value</p>
                <p className="text-2xl font-bold text-black">$28.50</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon name="DollarSign" size={16} color="#F59E0B" />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLeads?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800">
                {selectedLeads?.length} lead{selectedLeads?.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 bg-white border border-yellow-300 text-yellow-800 rounded-lg text-sm hover:bg-yellow-100">
                  Change Status
                </button>
                <button className="px-3 py-2 bg-white border border-yellow-300 text-yellow-800 rounded-lg text-sm hover:bg-yellow-100">
                  Export Selected
                </button>
                <button className="px-3 py-2 bg-white border border-yellow-300 text-yellow-800 rounded-lg text-sm hover:bg-yellow-100">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">All Leads</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search leads..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Icon name="Search" size={16} color="#6B7280" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads?.length === leads?.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Contact Info</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Source & Flow</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Location</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Budget</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads?.map((lead) => (
                  <tr key={lead?.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads?.includes(lead?.id)}
                        onChange={() => handleSelectLead(lead?.id)}
                        className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-black">{lead?.name}</p>
                        <p className="text-sm text-gray-600">{lead?.email}</p>
                        <p className="text-sm text-gray-600">{lead?.phone}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead?.source}</p>
                        <p className="text-sm text-gray-600">{lead?.flow}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{lead?.city}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{lead?.budget}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <Icon name={getStatusIcon(lead?.status)} size={14} color="#6B7280" />
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead?.status)}`}>
                          {lead?.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{lead?.created}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Icon name="Eye" size={16} color="#6B7280" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Icon name="MessageSquare" size={16} color="#6B7280" />
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
          
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">Showing 1 to 3 of 8,547 results</p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Export Leads</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} color="#6B7280" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="radio" name="format" value="csv" className="text-yellow-500 focus:ring-yellow-500" defaultChecked />
                    <span className="ml-2 text-sm">CSV (.csv)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="format" value="excel" className="text-yellow-500 focus:ring-yellow-500" />
                    <span className="ml-2 text-sm">Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="format" value="json" className="text-yellow-500 focus:ring-yellow-500" />
                    <span className="ml-2 text-sm">JSON (.json)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fields to Include</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Name', 'Email', 'Phone', 'Source', 'Flow', 'Status', 'City', 'Budget', 'Created Date']?.map((field) => (
                    <label key={field} className="flex items-center">
                      <input type="checkbox" className="text-yellow-500 focus:ring-yellow-500 rounded" defaultChecked />
                      <span className="ml-2 text-sm">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium"
                >
                  Export Leads
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDatabase;