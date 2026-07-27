import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AppLayout } from "@/components/app/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

import Home from "@/pages/site/Home";
import About from "@/pages/site/About";
import Contact from "@/pages/site/Contact";
import Features from "@/pages/site/Features";
import Help from "@/pages/site/Help";
import Guides from "@/pages/site/Guides";
import HowItWorks from "@/pages/site/HowItWorks";
import Marketplace from "@/pages/site/Marketplace";
import Pricing from "@/pages/site/Pricing";
import Privacy from "@/pages/site/Privacy";
import Terms from "@/pages/site/Terms";

import Dashboard from "@/pages/app/Dashboard";
import Analytics from "@/pages/app/Analytics";
import AiTools from "@/pages/app/AiTools";
import AIAssistant from "@/pages/app/AIAssistant";
import Crops from "@/pages/app/Crops";
import Farms from "@/pages/app/Farms";
import FarmNew from "@/pages/app/FarmNew";
import AppHelp from "@/pages/app/AppHelp";
import Market from "@/pages/app/Market";
import Notifications from "@/pages/app/Notifications";
import Orders from "@/pages/app/Orders";
import Profile from "@/pages/app/Profile";
import Scan from "@/pages/app/Scan";
import Settings from "@/pages/app/Settings";
import Subscription from "@/pages/app/Subscription";
import Weather from "@/pages/app/Weather";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import VerifyOtp from "@/pages/VerifyOtp";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="features" element={<Features />} />
        <Route path="help" element={<Help />} />
        <Route path="guides" element={<Guides />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
      </Route>

      <Route path="app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-tools" element={<AiTools />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="crops" element={<Crops />} />
        <Route path="farms" element={<Farms />} />
        <Route path="farms/new" element={<FarmNew />} />
        <Route path="help" element={<AppHelp />} />
        <Route path="market" element={<Market />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
        <Route path="scan" element={<Scan />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="weather" element={<Weather />} />
      </Route>

      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="verify-otp" element={<VerifyOtp />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Go home
        </Link>
      </div>
    </div>
  );
}
