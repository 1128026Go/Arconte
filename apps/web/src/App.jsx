import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Eager load critical pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// Lazy load other pages for better performance
const Cases = lazy(() => import("./pages/Cases.jsx"));
const CaseDetail = lazy(() => import("./pages/CaseDetail.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const Reminders = lazy(() => import("./pages/Reminders.jsx"));
const TimeTracking = lazy(() => import("./pages/TimeTracking.jsx"));
const Billing = lazy(() => import("./pages/Billing.jsx"));
const Jurisprudence = lazy(() => import("./pages/Jurisprudence.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const AIAssistant = lazy(() => import("./pages/AIAssistant.jsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.jsx"));
const Tutorial = lazy(() => import("./pages/Tutorial.jsx"));
const Logout = lazy(() => import("./pages/Logout.jsx"));
const FloatingAI = lazy(() => import("./components/AIAssistant/FloatingAI.jsx"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600">Cargando...</p>
    </div>
  </div>
);

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {token && (
          <Suspense fallback={null}>
            <FloatingAI />
          </Suspense>
        )}
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <Cases />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute>
                <CaseDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/time-tracking"
            element={
              <ProtectedRoute>
                <TimeTracking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jurisprudence"
            element={
              <ProtectedRoute>
                <Jurisprudence />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />

          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutorial"
            element={
              <ProtectedRoute>
                <Tutorial />
              </ProtectedRoute>
            }
          />

          <Route path="/logout" element={<Logout />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
