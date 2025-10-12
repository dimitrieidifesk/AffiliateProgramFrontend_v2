import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const TrackingUrls = () => {
  const [urls, setUrls] = useState([
    {
      id: 1,
      name: 'Real Estate Moscow Campaign',
      shortUrl: 'https://ld.mk/re-moscow-001',
      originalUrl: 'https://avito.ru/moskva/kvartiry/prodam',
      clicks: 2847,
      leads: 347,
      conversion: 12.2,
      status: 'active',
      created: '2025-01-15'
    },
    {
      id: 2,
      name: 'Auto Sales SPB',
      shortUrl: 'https://ld.mk/auto-spb-002',
      originalUrl: 'https://avito.ru/sankt-peterburg/avtomobili',
      clicks: 1965,
      leads: 198,
      conversion: 10.1,
      status: 'active',
      created: '2025-01-12'
    },
    {
      id: 3,
      name: 'Services Regional',
      shortUrl: 'https://ld.mk/services-003',
      originalUrl: 'https://avito.ru/rossiya/uslugi',
      clicks: 1254,
      leads: 89,
      conversion: 7.1,
      status: 'paused',
      created: '2025-01-08'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard?.writeText(url);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">Tracking URLs</h1>
            <p className="text-gray-600 text-sm">Generate and manage tracking links for your campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium"
          >
            <Icon name="Plus" size={16} color="black" />
            <span>Create URL</span>
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active URLs</p>
                <p className="text-2xl font-bold text-black">24</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Link" size={16} color="#22C55E" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Clicks</p>
                <p className="text-2xl font-bold text-black">47,285</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="MousePointer" size={16} color="#3B82F6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Leads</p>
                <p className="text-2xl font-bold text-black">4,847</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="Target" size={16} color="#8B5CF6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg CTR</p>
                <p className="text-2xl font-bold text-black">10.2%</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={16} color="#F59E0B" />
              </div>
            </div>
          </div>
        </div>

        {/* URLs Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-black">Tracking URLs</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search URLs..."
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
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Campaign Name</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Tracking URL</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Clicks</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Leads</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Conversion</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {urls?.map((url) => (
                  <tr key={url?.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-black">{url?.name}</p>
                        <p className="text-sm text-gray-600">Created: {url?.created}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <p className="font-mono text-sm text-blue-600">{url?.shortUrl}</p>
                          <p className="text-xs text-gray-500 truncate max-w-48">{url?.originalUrl}</p>
                        </div>
                        <button
                          onClick={() => handleCopyUrl(url?.shortUrl, url?.id)}
                          className={`p-1 rounded ${copiedUrl === url?.id ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                          title="Copy URL"
                        >
                          <Icon 
                            name={copiedUrl === url?.id ? "Check" : "Copy"} 
                            size={16} 
                            color={copiedUrl === url?.id ? "#22C55E" : "#6B7280"} 
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{url?.clicks?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{url?.leads}</td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-medium ${url?.conversion > 10 ? 'text-green-600' : url?.conversion > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {url?.conversion}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        url?.status === 'active' ?'bg-green-100 text-green-800' :'bg-gray-100 text-gray-800'
                      }`}>
                        {url?.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Icon name="BarChart3" size={16} color="#6B7280" />
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
      {/* Create URL Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Create Tracking URL</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} color="#6B7280" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter campaign name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="https://example.com/landing-page"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Alias (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="my-campaign"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated alias</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Traffic Source</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                  <option>Google Ads</option>
                  <option>Yandex Direct</option>
                  <option>Facebook Ads</option>
                  <option>TikTok Ads</option>
                  <option>VK Ads</option>
                  <option>Direct Traffic</option>
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
                  Generate URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingUrls;