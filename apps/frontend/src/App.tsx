import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ExhibitionProvider } from "@/contexts/ExhibitionContext";
import { DataProvider } from "@/contexts/DataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Stalls from "./pages/Stalls";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";
import Receipts from "./pages/Payments";
import StallPrices from "./pages/StallPrices";
import Expenses from "./pages/Expenses";
import TeamLedger from "./pages/TeamLedger";
import Accounts from "./pages/Accounts";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Dashboard /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/floor-layout" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Index /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Leads /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/stalls" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Stalls /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Services /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Transactions /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Receipts /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/payments" element={<Navigate to="/receipts" replace />} />
      <Route path="/expenses" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Expenses /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/team-ledger" element={<ProtectedRoute><ExhibitionProvider><DataProvider><TeamLedger /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/accounts" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Accounts /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Users /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><ExhibitionProvider><DataProvider><Settings /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="/stall-prices" element={<ProtectedRoute><ExhibitionProvider><DataProvider><StallPrices /></DataProvider></ExhibitionProvider></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
