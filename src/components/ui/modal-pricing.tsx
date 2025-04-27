"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Sparkles, Zap, QrCode, CreditCard, Barcode } from "lucide-react";

interface PaymentOption {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

const paymentOptions: PaymentOption[] = [
    {
        id: "pix",
        name: "PIX",
        icon: <QrCode className="w-5 h-5 text-green-600" />,
        description: "Pagamento instantâneo via PIX.",
    },
    {
        id: "credit_card",
        name: "Cartão de Crédito",
        icon: <CreditCard className="w-5 h-5 text-blue-600" />,
        description: "Pague com cartão de crédito.",
    },
    {
        id: "boleto",
        name: "Boleto Bancário",
        icon: <Barcode className="w-5 h-5 text-yellow-600" />,
        description: "Gere um boleto para pagamento.",
    },
];

function ModalPaymentMethod({
    onSelect,
    defaultOpen = false,
}: {
    onSelect: (method: string, preencherDados?: boolean) => void;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [selected, setSelected] = useState(paymentOptions[0].id);
    // Iniciar com preencherDados como false (usuário preencherá manualmente) para evitar erros de CEP
    const [preencherDados, setPreencherDados] = useState(false);

    const handleConfirm = () => {
        setIsOpen(false);
        onSelect(selected, preencherDados);
    };

    return (
        <>
            <div className="flex justify-center">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Escolher forma de pagamento
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
                            <Zap className="h-5 w-5 text-zinc-900 dark:text-white" />
                            Escolha o método de pagamento
                        </DialogTitle>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            Selecione como deseja pagar sua assinatura.
                        </p>
                    </DialogHeader>

                    <RadioGroup
                        defaultValue={selected}
                        onValueChange={setSelected}
                        className="gap-4 py-4"
                    >
                        {paymentOptions.map((option) => (
                            <label
                                key={option.id}
                                className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all
                                    ${
                                        selected === option.id
                                            ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    }`}
                            >
                                <RadioGroupItem
                                    value={option.id}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-3 mb-2">
                                    {option.icon}
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                            {option.name}
                                        </h3>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                                {selected === option.id && (
                                    <div className="absolute -top-2 -right-2">
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-white">
                                            <Check className="h-3 w-3 text-white dark:text-zinc-900" />
                                        </span>
                                    </div>
                                )}
                            </label>
                        ))}
                    </RadioGroup>

                    <div className="border rounded-lg p-4 mt-4 mb-4 bg-zinc-50 dark:bg-zinc-800/50">
                        <h4 className="font-medium text-sm mb-2 text-zinc-900 dark:text-white">Opções de preenchimento de dados</h4>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="preencherManual"
                                    name="preenchimento"
                                    checked={!preencherDados}
                                    onChange={() => setPreencherDados(false)}
                                    className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                                />
                                <label
                                    htmlFor="preencherManual"
                                    className="text-sm font-medium text-zinc-900 dark:text-white"
                                >
                                    Preencher meus dados manualmente
                                </label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="preencherAuto"
                                    name="preenchimento"
                                    checked={preencherDados}
                                    onChange={() => setPreencherDados(true)}
                                    className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                                />
                                <label
                                    htmlFor="preencherAuto"
                                    className="text-sm font-medium text-zinc-900 dark:text-white"
                                >
                                    Preencher meus dados automaticamente
                                </label>
                            </div>
                        </div>
                        
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            {preencherDados 
                                ? "Seus dados cadastrados serão enviados automaticamente para o checkout." 
                                : "Recomendado: você preencherá seus dados diretamente na página de pagamento."}
                        </p>
                        
                        {preencherDados && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                    Atenção: Se o pagamento falhar com erro de CEP, tente novamente escolhendo a opção para preencher seus dados manualmente.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col gap-2">
                        <Button
                            onClick={handleConfirm}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        >
                            Confirmar método
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="w-full text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export { ModalPaymentMethod, paymentOptions };
