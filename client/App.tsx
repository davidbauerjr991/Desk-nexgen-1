import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PhoneCall, Users, BookOpen, MessageSquare } from "lucide-react";

import Activity from "./pages/Activity";
import Desk from "./pages/Desk";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import Schedule from "./pages/Schedule";
import SettingsPage from "./pages/SettingsPage";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/activity" replace />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/desk" element={<Desk />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            <Route path="/calls" element={
              <Placeholder 
                title="Active Calls" 
                description="Manage active voice calls, view call history, and access call analytics in one place." 
                icon={PhoneCall} 
              />
            } />
            <Route path="/chats" element={
              <Placeholder 
                title="Active Chats" 
                description="Handle multi-channel chat interactions from web, SMS, and social platforms." 
                icon={MessageSquare} 
              />
            } />
            <Route path="/customers" element={
              <Placeholder 
                title="Customer Directory" 
                description="View comprehensive customer profiles, interaction history, and segment data." 
                icon={Users} 
              />
            } />
            <Route path="/knowledge" element={
              <Placeholder 
                title="Knowledge Base" 
                description="Access internal documentation, canned responses, and AI-suggested articles." 
                icon={BookOpen} 
              />
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
