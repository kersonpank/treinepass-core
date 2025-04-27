import { ModalPaymentMethod } from "@/components/ui/modal-pricing";

function DemoModal() {
    const handleSelect = (method: string) => {
        alert(`Método selecionado: ${method}`);
    };
    return <ModalPaymentMethod onSelect={handleSelect} />;
}

export { DemoModal };
