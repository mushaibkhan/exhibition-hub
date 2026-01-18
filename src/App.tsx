import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExhibitionProvider } from "@/contexts/ExhibitionContext";
import { SupabaseDataProvider } from "@/contexts/SupabaseDataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Stalls from "./pages/Stalls";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
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
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
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
