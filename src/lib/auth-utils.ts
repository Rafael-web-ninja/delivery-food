function getNameFromEmail(email?: string | null) {
  if (!email) return undefined;
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : email;
}

export function getDisplayName(user?: any, profile?: any) {
  return (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    profile?.name ??
    getNameFromEmail(user?.email) ??
    'Conta'
  );
}

export function getCustomerName(customerData?: any, user?: any) {
  return (
    customerData?.name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    getNameFromEmail(user?.email) ??
    'Cliente'
  );
}