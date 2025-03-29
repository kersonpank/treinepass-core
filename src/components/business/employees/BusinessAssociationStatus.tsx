
interface BusinessAssociationStatusProps {
  employeeData: any;
  businessSubscription: any;
}

export function BusinessAssociationStatus({ 
  employeeData, 
  businessSubscription 
}: BusinessAssociationStatusProps) {
  // Check if user is associated with a business
  if (!employeeData || !employeeData.business_profiles) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">Você não está associado a nenhuma empresa</h3>
        <p className="text-muted-foreground">
          Para acessar planos cofinanciados, é necessário estar vinculado a uma empresa.
        </p>
      </div>
    );
  }

  // Check if business has an active subscription
  if (!businessSubscription) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">Sua empresa não possui um plano ativo</h3>
        <p className="text-muted-foreground">
          A empresa {employeeData.business_profiles.company_name} precisa contratar um plano para oferecer benefícios cofinanciados.
        </p>
      </div>
    );
  }

  return null;
}
