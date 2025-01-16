import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StaffMember {
  id: string;
  role: "gym_owner" | "gym_admin" | "gym_staff";
  active: boolean;
  user_id: string;
  user_profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface StaffPanelProps {
  staffMembers?: StaffMember[];
}

export function StaffPanel({ staffMembers }: StaffPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button>Convidar Funcionário</Button>

          <div className="grid gap-4">
            {staffMembers?.map((member) => (
              <Card key={member.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {member.user_profiles?.full_name || "Nome não disponível"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user_profiles?.email || "Email não disponível"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          member.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.active ? "Ativo" : "Inativo"}
                      </span>
                      <Button variant="outline" size="sm">
                        Gerenciar Acesso
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}