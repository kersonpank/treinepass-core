
/**
 * Handler para criar/buscar cliente no Asaas
 */

export async function handleCreateCustomer(data: any, apiKey: string, baseUrl: string) {
  console.log("Creating/finding customer with data:", data);
  
  try {
    // Validar dados obrigatórios
    if (!data.name || !data.cpfCnpj || !data.email) {
      throw new Error("Name, CPF/CNPJ and email are required");
    }
    
    // Formatar CPF/CNPJ - remover caracteres especiais
    data.cpfCnpj = data.cpfCnpj.replace(/[^\d]/g, '');
    
    // Formatar CEP - garantir que tenha 8 dígitos
    if (data.postalCode) {
      data.postalCode = data.postalCode.replace(/[^\d]/g, '');
      // Se o CEP não tiver 8 dígitos, usar um valor padrão válido
      if (data.postalCode.length !== 8) {
        data.postalCode = "01310930"; // CEP válido para São Paulo (Av. Paulista)
      }
    } else {
      data.postalCode = "01310930"; // CEP padrão válido
    }
    
    // Garantir que temos dados de endereço padrão se não fornecidos
    if (!data.address) data.address = "Av Paulista";
    if (!data.addressNumber) data.addressNumber = "1000";
    if (!data.province) data.province = "Bela Vista";
    
    // Verificar se o cliente já existe pelo CPF/CNPJ
    const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${data.cpfCnpj}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      }
    });

    const searchResult = await searchResponse.json();
    
    // Se encontrou o cliente, retornar
    if (searchResponse.ok && searchResult.data && searchResult.data.length > 0) {
      console.log("Customer already exists:", searchResult.data[0]);
      return {
        success: true,
        id: searchResult.data[0].id,
        name: searchResult.data[0].name,
        email: searchResult.data[0].email,
        cpfCnpj: searchResult.data[0].cpfCnpj
      };
    }
    
    // Se não encontrou, criar um novo cliente
    const createResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'TreinePass-App'
      },
      body: JSON.stringify(data)
    });

    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error("Asaas API error:", createResult);
      throw new Error(createResult.errors?.[0]?.description || 'Unknown error creating customer');
    }

    console.log("Customer created successfully:", createResult);
    
    return {
      success: true,
      id: createResult.id,
      name: createResult.name,
      email: createResult.email,
      cpfCnpj: createResult.cpfCnpj
    };
  } catch (error) {
    console.error("Error creating/finding customer:", error);
    throw error;
  }
}
