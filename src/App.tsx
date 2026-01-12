import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExhibitionProvider } from "@/contexts/ExhibitionContext";
import { MockDataProvider } from "@/contexts/MockDataContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Stalls from "./pages/Stalls";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";
import Payments from "./pages/Payments";
import Accounts from "./pages/Accounts";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ExhibitionProvider>
      <MockDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/stalls" element={<Stalls />} />
              <Route path="/services" element={<Services />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/users" element={<Users />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MockDataProvider>
    </ExhibitionProvider>
  </QueryClientProvider>
);

export default App;
