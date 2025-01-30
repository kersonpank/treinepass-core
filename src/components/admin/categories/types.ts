export interface Category {
  id: string;
  nome: string;
  descricao: string | null;
  active: boolean;
  ordem: number;
}