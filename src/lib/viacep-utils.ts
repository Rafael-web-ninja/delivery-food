// ViaCEP API integration for Brazilian ZIP code lookup

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export const maskZipCode = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2').replace(/-$/, '');
};

export const unmaskZipCode = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const isValidZipCode = (zipCode: string): boolean => {
  const digits = unmaskZipCode(zipCode);
  return digits.length === 8;
};

export const fetchAddressByZipCode = async (zipCode: string): Promise<ViaCEPResponse | null> => {
  const cleanZipCode = unmaskZipCode(zipCode);
  
  if (!isValidZipCode(cleanZipCode)) {
    throw new Error('CEP inválido');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }

    const data: ViaCEPResponse = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    throw error;
  }
};