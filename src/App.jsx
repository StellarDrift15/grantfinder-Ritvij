import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from "./pages/Dashboard";
import ColdCallingPage from "./pages/ColdCallingPage";
import SponsorshipFinder from "./pages/SponsorshipFinder";
import DraftReviewer from "./pages/DraftReviewer";
import EssayDrafter from "./pages/EssayDrafter";
import InKindDonations from "./pages/InKindDonations";
import Discover from "./pages/Discover";
import Saved from "./pages/Saved";
import Reports from "./pages/Reports";
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/cold-calling" element={<ColdCallingPage />} />
      <Route path="/sponsorship-finder" element={<SponsorshipFinder />} />
      <Route path="/draft-reviewer" element={<DraftReviewer />} />
      <Route path="/essay-drafter" element={<EssayDrafter />} />
      <Route path="/in-kind-donations" element={<InKindDonations />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App