import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';

// Components
import LeadFiltersToolbar from './components/LeadFiltersToolbar';
import LeadTable from './components/LeadTable';
import BulkActionsBar from './components/BulkActionsBar';
import ExportModal from './components/ExportModal';

const LeadStatistics = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState('webmaster');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    dateRange: '30d',
    status: 'all',
    source: 'all',
    city: 'all',
    quality: 'all',
    amountFrom: '',
    amountTo: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  // Mock user data
  const mockUser = {
    name: "Alex Petrov",
    email: "alex.petrov@leadmaker.pro", 
    role: "Senior Webmaster",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  };

  // Mock lead data with comprehensive details
  const mockLeads = [
    {
      id: 1,
      date: '2024-12-25',
      time: '14:32',
      source: 'Avito',
      status: 'confirmed',
      client: 'Иван Петров',
      phone: '+7 (905) 123-45-67',
      city: 'Москва',
      amount: 5200,
      commission: 1560,
      quality: 'high',
      assignedTo: 'Менеджер А',
      notes: 'Клиент заинтересован в покупке'
    },
    {
      id: 2,
      date: '2024-12-25',
      time: '13:15',
      source: 'Яндекс.Директ',
      status: 'in_work',
      client: 'Мария Сидорова',
      phone: '+7 (916) 987-65-43',
      city: 'СПб',
      amount: 4800,
      commission: 1440,
      quality: 'medium',
      assignedTo: 'Менеджер Б',
      notes: 'Требует дополнительной консультации'
    },
    {
      id: 3,
      date: '2024-12-25',
      time: '12:45',
      source: 'Телефония',
      status: 'assigned',
      client: 'Алексей Козлов',
      phone: '+7 (495) 555-12-34',
      city: 'Екатеринбург',
      amount: 6100,
      commission: 1830,
      quality: 'high',
      assignedTo: 'Менеджер В',
      notes: 'Повторный звонок через час'
    },
    {
      id: 4,
      date: '2024-12-24',
      time: '18:20',
      source: 'Лендинги',
      status: 'client_refusal',
      client: 'Ольга Волкова',
      phone: '+7 (812) 444-55-66',
      city: 'СПб',
      amount: 3900,
      commission: 0,
      quality: 'low',
      assignedTo: null,
      notes: 'Клиент передумал'
    },
    {
      id: 5,
      date: '2024-12-24',
      time: '16:30',
      source: 'SEO',
      status: 'low_quality',
      client: 'Дмитрий Новиков',
      phone: '+7 (903) 777-88-99',
      city: 'Казань',
      amount: 2800,
      commission: 0,
      quality: 'low',
      assignedTo: null,
      notes: 'Недостоверная информация'
    },
    {
      id: 6,
      date: '2024-12-24',
      time: '15:10',
      source: 'Target',
      status: 'confirmed',
      client: 'Анна Морозова',
      phone: '+7 (926) 333-22-11',
      city: 'Новосибирск',
      amount: 5500,
      commission: 1650,
      quality: 'high',
      assignedTo: 'Менеджер Г',
      notes: 'Сделка успешно закрыта'
    },
    {
      id: 7,
      date: '2024-12-24',
      time: '14:55',
      source: 'Avito',
      status: 'in_work',
      client: 'Сергей Белов',
      phone: '+7 (917) 666-77-88',
      city: 'Москва',
      amount: 4200,
      commission: 1260,
      quality: 'medium',
      assignedTo: 'Менеджер Д',
      notes: 'Ожидаем решение клиента'
    },
    {
      id: 8,
      date: '2024-12-24',
      time: '13:40',
      source: 'Телефония',
      status: 'assigned',
      client: 'Елена Жукова',
      phone: '+7 (495) 999-00-11',
      city: 'Москва',
      amount: 7200,
      commission: 2160,
      quality: 'high',
      assignedTo: 'Менеджер Е',
      notes: 'VIP клиент'
    }
  ];

  // Filter and sort leads based on current settings
  const filteredLeads = mockLeads?.filter(lead => {
    if (filters?.status !== 'all' && lead?.status !== filters?.status) return false;
    if (filters?.source !== 'all' && lead?.source !== filters?.source) return false;
    if (filters?.city !== 'all' && lead?.city !== filters?.city) return false;
    if (filters?.quality !== 'all' && lead?.quality !== filters?.quality) return false;
    if (filters?.amountFrom && lead?.amount < parseInt(filters?.amountFrom)) return false;
    if (filters?.amountTo && lead?.amount > parseInt(filters?.amountTo)) return false;
    return true;
  })?.sort((a, b) => {
    if (sortConfig?.direction === 'asc') {
      return a?.[sortConfig?.key] > b?.[sortConfig?.key] ? 1 : -1;
    }
    return a?.[sortConfig?.key] < b?.[sortConfig?.key] ? 1 : -1;
  });

  // Pagination
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredLeads?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads?.slice(startIndex, startIndex + itemsPerPage);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLeadSelection = (leadIds) => {
    setSelectedLeads(leadIds);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'desc' ? 'asc' : 'desc'
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleExport = (format) => {
    console.log(`Exporting ${selectedLeads?.length || filteredLeads?.length} leads in ${format} format`);
    setShowExportModal(false);
  };

  const handleBulkAction = (action) => {
    console.log(`Performing ${action} on ${selectedLeads?.length} leads`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(amount);
  };

  return (
    <div className="min-h-screen bg-leadmaker-pattern relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-yellow-primary opacity-5 rounded-full animate-float"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-black opacity-5 rounded-full animate-float-delayed"></div>
      </div>

      <Header 
        user={mockUser} 
        onMenuToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
      />
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userRole={userRole}
      />
      <main className={`
        pt-header-height nav-transition relative z-10
        ${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}
      `}>
        <div className="p-2 w-full">
          {/* Page Header */}
          <div className="mb-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-text-primary mb-1 flex items-center">
                  <Icon name="BarChart3" size={24} color="#FFD600" className="mr-2" />
                  Статистика по лидам
                </h1>
                <p className="text-text-secondary text-base">
                  Полный отчет по всем лидам с возможностью фильтрации и экспорта данных
                </p>
              </div>
              <div className="mt-3 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                {/* Summary stats */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                    Всего: {filteredLeads?.length}
                  </div>
                  <div className="px-2 py-1 bg-success-100 text-success-700 rounded font-medium">
                    Подтверждено: {filteredLeads?.filter(l => l?.status === 'confirmed')?.length}
                  </div>
                </div>
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="gradient-secondary text-black px-4 py-2 rounded-lg hover:shadow-card-hover nav-transition flex items-center space-x-1 font-medium transform hover:scale-105 active:scale-95"
                >
                  <Icon name="Download" size={14} color="#000000" />
                  <span>Экспорт</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <LeadFiltersToolbar 
            filters={filters}
            onFiltersChange={handleFilterChange}
            resultCount={filteredLeads?.length}
          />

          {/* Bulk Actions Bar */}
          {selectedLeads?.length > 0 && (
            <BulkActionsBar 
              selectedCount={selectedLeads?.length}
              onBulkAction={handleBulkAction}
            />
          )}

          {/* Lead Table */}
          <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
            <LeadTable 
              leads={paginatedLeads}
              selectedLeads={selectedLeads}
              onLeadSelection={handleLeadSelection}
              sortConfig={sortConfig}
              onSort={handleSort}
              formatCurrency={formatCurrency}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface">
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <span>Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLeads?.length)} из {filteredLeads?.length}</span>
                <select 
                  value={itemsPerPage}
                  className="border border-border rounded px-2 py-1 bg-surface text-text-primary text-sm focus:border-yellow-primary focus:outline-none"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-border rounded hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed nav-transition"
                >
                  ««
                </button>
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-border rounded hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed nav-transition"
                >
                  ‹
                </button>
                
                {Array?.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage - 2 + i;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded nav-transition ${
                        page === currentPage 
                          ? 'bg-yellow-primary text-black border-yellow-primary font-medium' :'border-border hover:bg-yellow-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-border rounded hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed nav-transition"
                >
                  ›
                </button>
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-border rounded hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed nav-transition"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal 
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
          selectedCount={selectedLeads?.length}
          totalCount={filteredLeads?.length}
        />
      )}
    </div>
  );
};

export default LeadStatistics;