// Phone masking utilities for Brazilian phone numbers

export const maskPhone = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply mask based on length
  if (digits.length <= 10) {
    // Landline format: (11) 1234-5678
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
  } else {
    // Mobile format: (11) 91234-5678
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
  }
};

export const unmaskPhone = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const isValidPhone = (phone: string): boolean => {
  const digits = unmaskPhone(phone);
  return digits.length >= 10 && digits.length <= 11;
};