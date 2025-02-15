
import { Business } from "./types/business";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BusinessTableRow } from "./BusinessTableRow";

interface BusinessTableProps {
  businesses: Business[] | undefined;
  onStatusChange: (businessId: string, newStatus: string) => void;
  onDelete: (businessId: string) => void;
  onView: (business: Business) => void;
  onEdit: (business: Business) => void;
  onPlanManage: (business: Business) => void;
}

export function BusinessTable({
  businesses,
  onStatusChange,
  onDelete,
  onView,
  onEdit,
  onPlanManage,
}: BusinessTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Empresa</TableHead>
            <TableHead className="w-[250px]">Contato</TableHead>
            <TableHead className="w-[100px]">Funcionários</TableHead>
            <TableHead className="w-[250px]">Planos</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {businesses?.map((business) => (
            <BusinessTableRow
              key={business.id}
              business={business}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onView={onView}
              onEdit={onEdit}
              onPlanManage={onPlanManage}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
