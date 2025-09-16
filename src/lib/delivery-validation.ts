import { supabase } from '@/integrations/supabase/client';

/**
 * Normalizes a ZIP code by removing non-numeric characters
 */
export const normalizeZipCode = (zipCode: string): string => {
  return zipCode.replace(/\D/g, '');
};

/**
 * Formats a ZIP code for display (XXXXX-XXX format for Brazilian CEPs)
 */
export const formatZipCode = (zipCode: string): string => {
  const normalized = normalizeZipCode(zipCode);
  if (normalized.length === 8) {
    return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  }
  return zipCode;
};

/**
 * Validates if a ZIP code is within the delivery area for a business
 */
export const validateDeliveryArea = async (
  businessId: string, 
  zipCode: string
): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const normalizedZip = normalizeZipCode(zipCode);
    
    if (normalizedZip.length < 5) {
      return {
        isValid: false,
        message: 'CEP deve ter pelo menos 5 dígitos'
      };
    }

    // Check if there are any delivery areas configured for this business
    const { data: areas, error } = await supabase
      .from('delivery_areas')
      .select('zip_code')
      .eq('business_id', businessId);

    if (error) {
      console.error('Erro ao consultar áreas de entrega:', error);
      return {
        isValid: false,
        message: 'Erro ao validar área de entrega'
      };
    }

    // If no areas are configured, allow all deliveries
    if (!areas || areas.length === 0) {
      return { isValid: true };
    }

    // Check for exact match or partial match (first 5 digits for Brazilian CEPs)
    const isInDeliveryArea = areas.some(area => {
      const areaZip = normalizeZipCode(area.zip_code);
      
      // Exact match
      if (areaZip === normalizedZip) return true;
      
      // Partial match for same neighborhood (first 5 digits)
      if (areaZip.length >= 5 && normalizedZip.length >= 5) {
        return areaZip.slice(0, 5) === normalizedZip.slice(0, 5);
      }
      
      return false;
    });

    return {
      isValid: isInDeliveryArea,
      message: isInDeliveryArea 
        ? undefined 
        : 'CEP fora da área de entrega'
    };

  } catch (error) {
    console.error('Erro na validação de área de entrega:', error);
    return {
      isValid: false,
      message: 'Erro ao validar área de entrega'
    };
  }
};

/**
 * Extracts ZIP code from an address string
 */
export const extractZipCodeFromAddress = (address: string): string | null => {
  // Brazilian ZIP code pattern: XXXXX-XXX or XXXXXXXX
  const zipPattern = /\b\d{5}-?\d{3}\b/;
  const match = address.match(zipPattern);
  return match ? match[0] : null;
};