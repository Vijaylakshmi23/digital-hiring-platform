import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import WorkerApplication from "./pages/WorkerApplication";
import WorkerDetail from "./pages/WorkerDetail";
import WorkerProfile from "./pages/WorkerProfile";
import Booking from "./pages/Booking";
import BookingDetail from "./pages/BookingDetail";
import DirectChatPage from "./pages/DirectChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/worker-application" element={<WorkerApplication />} />
          <Route path="/worker-profile" element={<WorkerProfile />} />
          <Route path="/worker/:workerId" element={<WorkerDetail />} />
          <Route path="/booking/:workerId" element={<Booking />} />
          <Route path="/booking/:id" element={<BookingDetail />} />
          <Route path="/booking-detail/:bookingId" element={<BookingDetail />} />
          <Route path="/chat/:userId" element={<DirectChatPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
