import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PhoneCall, Users, BookOpen, Settings, MessageSquare } from "lucide-react";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            
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
            <Route path="/settings" element={
              <Placeholder 
                title="Agent Settings" 
                description="Configure your workspace, notification preferences, and integrations." 
                icon={Settings} 
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
