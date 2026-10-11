/* SIRI.DEV */
import React, { useEffect, useState } from 'react';
import { EmailActionPage } from './auth/EmailActionPage';
import { parseEmailAction } from './auth/emailActions';
import { AuthPage } from './auth/AuthPage';
import { useAuth } from './auth/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustBar } from './components/TrustBar';
import { ServiceMatcherBanner } from './components/ServiceMatcherBanner';
import { ServicesDirectory } from './components/ServicesDirectory';
import { WorkflowStepper } from './components/WorkflowStepper';
import { ApplicationTracker } from './components/ApplicationTracker';
import { ConversionPair } from './components/ConversionPair';
import { ClientDashboardPreview } from './components/ClientDashboardPreview';
import { Footer } from './components/Footer';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { SearchModal } from './components/SearchModal';
import { type ServiceItem, type DashboardTab } from './types';
import { paymentReturn } from './applications/payment';
import { UserDashboard } from './dashboard/UserDashboard';
import { AdminLogin } from './admin/AdminLogin';
import { AdminPortal } from './admin/AdminPortal';

export default function App() {
  const { user, loading, error } = useAuth();
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const authMode = hash === '#/login' ? 'login' : hash === '#/signup' ? 'signup' : null;
  const isPaymentReturn = !!paymentReturn(window.location.search);
  const isDashboard = (isPaymentReturn && !hash) || hash === '#/dashboard' || hash.startsWith('#/dashboard/');
  const isAdmin = hash === '#/admin' || hash.startsWith('#/admin/');

  useEffect(() => {
    if (user && authMode) window.location.hash = '#/dashboard';
    if (authMode || isDashboard || isAdmin) window.scrollTo(0, 0);
  }, [user, authMode, isDashboard, isAdmin]);

  let initialDashboardTab: DashboardTab = 'dashboard';
  if (isPaymentReturn && !hash) initialDashboardTab = 'payments';
  else if (hash.includes('/applications')) initialDashboardTab = 'applications';
  else if (hash.includes('/documents')) initialDashboardTab = 'documents';
  else if (hash.includes('/payments')) initialDashboardTab = 'payments';
  else if (hash.includes('/support')) initialDashboardTab = 'support';
  else if (hash.includes('/profile')) initialDashboardTab = 'profile';

  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();
  
  const [selectedDetailService, setSelectedDetailService] = useState<ServiceItem | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [trackerCaseId, setTrackerCaseId] = useState<string>('NA-2026-8841-LAG');

  const handleStartApplication = (serviceId?: string) => {
    setPreselectedServiceId(serviceId);
    window.location.hash = '#/dashboard';
  };

  const handleTrackApplication = () => {
    const el = document.getElementById('tracker');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHowItWorks = () => {
    const el = document.getElementById('workflow');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCaseFromDashboard = (caseId: string) => {
    setTrackerCaseId(caseId);
    handleTrackApplication();
  };

  const emailAction = parseEmailAction(hash);
  if (emailAction) return <EmailActionPage key={hash} initial={emailAction} />;

  if (isAdmin) {
    if (hash === '#/admin/login') return <AdminLogin />;
    return <AdminPortal currentPath={hash}/>;
  }

  if (authMode && !user) {
    if (loading) return <main className="p-12 text-center" role="status">Checking your session…</main>;
    return <AuthPage key={authMode} mode={authMode} />;
  }

  if (isDashboard) {
    if (loading) return <main className="p-12 text-center" role="status">Checking your session…</main>;
    if (!user) {
      return <AuthPage key="login" mode="login" />;
    }
    return <UserDashboard initialTab={initialDashboardTab} preselectedServiceId={preselectedServiceId} />;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#293B35] flex flex-col selection:bg-[#EDF7F2] selection:text-[#12352C]">
      
      {/* 1. Sticky nav */}
      <Navbar
        onStartApplication={() => handleStartApplication()}
        onTrackApplication={handleTrackApplication}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      <main className="flex-1">
        {error && <p role="alert" className="bg-red-50 p-4 text-center text-red-700">{error}</p>}
        {/* 2. Hero */}
        <Hero
          onStartApplication={() => handleStartApplication()}
          onHowItWorks={handleHowItWorks}
        />

        {/* 3. Trust bar */}
        <TrustBar />

        {/* 4. Service-matcher banner */}
        <ServiceMatcherBanner
          onSelectPackage={(serviceId) => handleStartApplication(serviceId)}
        />

        {/* 5. Services directory */}
        <ServicesDirectory
          onSelectService={(service) => setSelectedDetailService(service)}
        />

        {/* 6. 5-step workflow stepper preview */}
        <WorkflowStepper
          onStartStep={() => handleStartApplication()}
        />

        {/* 7. Live application tracker styled as passport visa page */}
        <ApplicationTracker initialCaseId={trackerCaseId} />

        {/* 8. Conversion pair */}
        <ConversionPair />

        {/* 9. Client dashboard preview */}
        <ClientDashboardPreview
          onSelectCase={handleSelectCaseFromDashboard}
        />
      </main>

      {/* 10. Footer */}
      <Footer />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedDetailService}
        onClose={() => setSelectedDetailService(null)}
        onApply={(service) => handleStartApplication(service.id)}
      />

      {/* Search Services Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectService={(service) => setSelectedDetailService(service)}
      />

    </div>
  );
}
