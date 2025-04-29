
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";

// Layout components
import AuthGuard from "@/components/auth/AuthGuard";
import PaymentStatusPage from "@/pages/PaymentStatusPage";

// Lazy loaded pages
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SystemPage = lazy(() => import("@/pages/admin/SystemPage"));
const Settings = lazy(() => import("@/pages/admin/SettingsPage"));
const PlansPage = lazy(() => import("@/pages/admin/PlansPage"));
const PlanEditPage = lazy(() => import("@/pages/admin/PlanEditPage"));
const BusinessPlansPage = lazy(() => import("@/pages/business/BusinessPlansPage"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const MarketingPage = lazy(() => import("@/pages/admin/MarketingPage"));
const BusinessRegistration = lazy(() => import("@/pages/business/BusinessRegistrationPage"));
const MobileDashboard = lazy(() => import("@/pages/mobile/MobileDashboard"));
const CheckInPage = lazy(() => import("@/pages/mobile/CheckInPage"));
const UserProfilePage = lazy(() => import("@/pages/mobile/UserProfilePage"));
const GymDashboard = lazy(() => import("@/pages/gym/GymDashboard"));
const GymSettingsPage = lazy(() => import("@/pages/gym/GymSettingsPage"));
const GymPlanEditPage = lazy(() => import("@/pages/gym/GymPlanEditPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/payment/success",
    element: <PaymentStatusPage />,
  },
  {
    path: "/payment/failure",
    element: <PaymentStatusPage />,
  },
  {
    path: "/app",
    element: (
      <AuthGuard>
        <MobileDashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/app/profile",
    element: (
      <AuthGuard>
        <UserProfilePage />
      </AuthGuard>
    ),
  },
  {
    path: "/app/checkin",
    element: (
      <AuthGuard>
        <CheckInPage />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard requiredRole="admin">
        <Dashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard/system",
    element: (
      <AuthGuard requiredRole="admin">
        <SystemPage />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard/settings",
    element: (
      <AuthGuard requiredRole="admin">
        <Settings />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard/plans",
    element: (
      <AuthGuard requiredRole="admin">
        <PlansPage />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard/plans/:id",
    element: (
      <AuthGuard requiredRole="admin">
        <PlanEditPage />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard/users",
    element: (
      <AuthGuard requiredRole="admin">
        <UsersPage />
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard/marketing",
    element: (
      <AuthGuard requiredRole="admin">
        <MarketingPage />
      </AuthGuard>
    ),
  },
  {
    path: "/business/register",
    element: <BusinessRegistration />,
  },
  {
    path: "/dashboard-empresa",
    element: (
      <AuthGuard requiredRole="business">
        <BusinessPlansPage />
      </AuthGuard>
    ),
  },
  {
    path: "/academia",
    element: (
      <AuthGuard requiredRole="gym">
        <GymDashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/academia/configuracoes",
    element: (
      <AuthGuard requiredRole="gym">
        <GymSettingsPage />
      </AuthGuard>
    ),
  },
  {
    path: "/academia/planos/:id",
    element: (
      <AuthGuard requiredRole="gym">
        <GymPlanEditPage />
      </AuthGuard>
    ),
  },
]);
