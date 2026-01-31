import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ExhibitionProvider } from "@/contexts/ExhibitionContext";
import { SupabaseDataProvider } from "@/contexts/SupabaseDataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ExhibitionProvider>
        <SupabaseDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/stalls" element={<Stalls />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/receipts" element={<Receipts />} />
                  <Route path="/payments" element={<Navigate to="/receipts" replace />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/team-ledger" element={<TeamLedger />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/stall-prices" element={<StallPrices />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </SupabaseDataProvider>
      </ExhibitionProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
