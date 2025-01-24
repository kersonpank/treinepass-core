import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GymCardProps {
  id: string;
  name: string;
  address: string;
}

export function GymCard({ id, name, address }: GymCardProps) {
  const navigate = useNavigate();

  const handleCheckIn = () => {
    navigate(`/app/digital-card/${id}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{address}</p>
        <Button onClick={handleCheckIn} className="w-full">
          Check-in
        </Button>
      </CardContent>
    </Card>
  );
}