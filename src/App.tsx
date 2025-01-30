import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layouts/AppLayout";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { GymProfile } from "@/pages/GymProfile";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const DigitalCardPage = lazy(() => import("@/pages/DigitalCardPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const CadastroAcademiaPage = lazy(() => import("@/pages/CadastroAcademiaPage"));
const CadastroEmpresaPage = lazy(() => import("@/pages/CadastroEmpresaPage"));
const CadastroEmpresaEndereco = lazy(() => import("@/pages/CadastroEmpresaEndereco"));
const CadastroEmpresaPlano = lazy(() => import("@/pages/CadastroEmpresaPlano"));
const CadastroEmpresaDocumentos = lazy(() => import("@/pages/CadastroEmpresaDocumentos"));

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: (
      <AuthLayout title="Login">
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AuthLayout title="Cadastro">
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: "/cadastro-academia",
    element: (
      <AuthLayout title="Cadastro de Academia">
        <CadastroAcademiaPage />
      </AuthLayout>
    ),
  },
  {
    path: "/cadastro-empresa",
    element: (
      <AuthLayout title="Cadastro de Empresa">
        <CadastroEmpresaPage />
      </AuthLayout>
    ),
  },
  {
    path: "/cadastro-empresa/endereco",
    element: (
      <AuthLayout title="Cadastro de Empresa">
        <CadastroEmpresaEndereco />
      </AuthLayout>
    ),
  },
  {
    path: "/cadastro-empresa/plano",
    element: (
      <AuthLayout title="Cadastro de Empresa">
        <CadastroEmpresaPlano />
      </AuthLayout>
    ),
  },
  {
    path: "/cadastro-empresa/documentos",
    element: (
      <AuthLayout title="Cadastro de Empresa">
        <CadastroEmpresaDocumentos />
      </AuthLayout>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <DashboardPage />,
      },
      {
        path: "digital-card/:gymId",
        element: <DigitalCardPage />,
      },
      {
        path: "admin",
        element: <AdminPage />,
      },
    ],
  },
  {
    path: "/gym/:id",
    element: <GymProfile />
  }
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}