export interface Categoria {
  id: string;
  usuarioId: string | null;
  nome: string;
  icone: string;
  corHexadecimal: string;
  ativo: boolean;
  criadoEm?: string;
}

export interface CategoriaRequest {
  nome: string;
  icone: string;
  corHexadecimal: string;
}
