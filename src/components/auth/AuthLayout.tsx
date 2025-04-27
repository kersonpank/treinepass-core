import { cn } from "@/lib/utils";

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  subtitle?: string; // Adicionando propriedade subtitle
  className?: string;
}

export function AuthLayout({ children, title, description, subtitle, className }: AuthLayoutProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Painel lateral - visível apenas em desktop */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.png" alt="Logo" className="h-8" />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              {description || subtitle}
            </p>
          </blockquote>
        </div>
      </div>
      
      {/* Conteúdo do formulário - responsivo para mobile */}
      <div className="px-4 py-6 lg:p-8">
        {/* Logo para mobile */}
        <div className="flex justify-center mb-6 lg:hidden">
          <img src="/logo.png" alt="Logo" className="h-8" />
        </div>
        
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
            {/* Descrição para mobile */}
            <p className="text-sm text-gray-500 lg:hidden">
              {description || subtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}