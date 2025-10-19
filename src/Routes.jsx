import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import TopNav from 'components/ui/TopNav';
import { useLocation } from 'react-router-dom';

// Основные страницы приложения
import Dashboard from "pages/dashboard";
import ThreadList from "pages/threads";
import ThreadForm from "pages/thread-form";
import ThreadWizard from "pages/thread-wizard";
import ThreadPostbacks from "pages/thread-postbacks";
import ChannelApiSettings from "pages/channel-api";
import ChannelTelephonySettings from "pages/channel-telephony";
import ChannelAvitoSettings from "pages/channel-avito";
import LeadsList from "pages/leads";
import ProfileManagement from "pages/profile-management";
import Registration from "pages/registration";
import Login from "pages/login";
import NotFound from "pages/NotFound";
import AdminStatsPage from 'pages/admin-stats';
import AdminPayoutsPage from 'pages/admin-payouts';
import RatesSettingsPage from 'pages/rates-settings';

const Routes = () => {
  return (
    <BrowserRouter>
      <InnerRoutes />
    </BrowserRouter>
  );
};

const InnerRoutes = () => {
  const location = useLocation();
  const hideTopNav = location.pathname === '/login' || location.pathname === '/registration';
  return (
    <>
      {!hideTopNav && <TopNav />}
      <div className={`${hideTopNav ? '' : 'pt-14'} min-h-screen bg-leadmaker-pattern`}>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
          {/* Основные маршруты */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/threads" element={<ThreadList />} />
          <Route path="/thread-wizard" element={<ThreadWizard />} />
          <Route path="/thread-wizard/:threadId" element={<ThreadWizard />} />
          <Route path="/thread-form" element={<ThreadForm />} />
          <Route path="/thread-form/:id" element={<ThreadForm />} />
          <Route path="/thread-postbacks/:id" element={<ThreadPostbacks />} />
          <Route path="/channel-api/:id" element={<ChannelApiSettings />} />
          <Route path="/channel-telephony/:id" element={<ChannelTelephonySettings />} />
                <Route path="/channel-avito/:id" element={<ChannelAvitoSettings />} />
                <Route path="/admin/stats" element={<AdminStatsPage />} />
                <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
                <Route path="/rates-settings" element={<RatesSettingsPage />} />
          
          {/* Старые маршруты для совместимости */}
          <Route path="/streams" element={<ThreadList />} />
          <Route path="/stream-form" element={<ThreadForm />} />
          <Route path="/stream-form/:id" element={<ThreadForm />} />
          
          <Route path="/leads" element={<LeadsList />} />
          <Route path="/profile-management" element={<ProfileManagement />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          
          {/* 404 страница */}
          <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </div>
    </>
  );
};

export default Routes;