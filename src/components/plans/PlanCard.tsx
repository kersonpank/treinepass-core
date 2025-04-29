
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { SubscribeButton } from "./SubscribeButton";

interface PlanCardProps {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  periodType?: "monthly" | "yearly";
  isPopular?: boolean;
  status?: "active" | "inactive";
  showSubscribeButton?: boolean;
}

export function PlanCard({ 
  id,
  name, 
  description, 
  monthlyPrice, 
  yearlyPrice, 
  features,
  periodType = "monthly",
  isPopular = false,
  status = "active",
  showSubscribeButton = true
}: PlanCardProps) {
  const price = periodType === 'yearly' ? (yearlyPrice || monthlyPrice * 12) : monthlyPrice;
  const isActive = status === "active";
  
  return (
    <Card className={`w-full ${isPopular ? 'border-primary' : ''} relative flex flex-col h-full`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-bl">
          Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <p className="text-3xl font-bold">
            {formatCurrency(price)}
            <span className="text-sm font-normal text-muted-foreground">
              /{periodType === 'yearly' ? 'ano' : 'mês'}
            </span>
          </p>
        </div>

        {features && features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 mr-2 text-green-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        {isActive && showSubscribeButton ? (
          <SubscribeButton 
            planId={id} 
            planName={name} 
            planValue={price} 
            className="w-full"
          />
        ) : !isActive ? (
          <div className="w-full p-2 text-center text-sm text-muted-foreground bg-muted rounded">
            Plano temporariamente indisponível
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}
