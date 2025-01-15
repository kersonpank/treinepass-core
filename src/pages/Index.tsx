import React, { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { UserTypeSelect } from "@/components/auth/UserTypeSelect";
import { LoginForm } from "@/components/auth/LoginForm";

const Index = () => {
  const [step, setStep] = useState<"type" | "login">("type");
  const [userType, setUserType] = useState<string | null>(null);

  const handleUserTypeSelect = (type: string) => {
    setUserType(type);
    setStep("login");
  };

  return (
    <div className="min-h-screen">
      {step === "type" ? (
        <AuthLayout
          title="Welcome to TreinePass"
          subtitle="Choose how you want to use TreinePass"
        >
          <UserTypeSelect onSelect={handleUserTypeSelect} />
        </AuthLayout>
      ) : (
        <AuthLayout
          title="Sign In"
          subtitle="Welcome back! Please enter your details"
        >
          <LoginForm />
        </AuthLayout>
      )}
    </div>
  );
};

export default Index;