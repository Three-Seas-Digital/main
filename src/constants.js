// Collision-resistant ID generator
export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Site info — single source of truth for contact details
export const SITE_INFO = {
  phone: '',       // TODO: Add your real phone number
  email: 'hello@threeseasdigital.com',
  address: '',     // TODO: Add your real business address
  name: 'Three Seas Digital',
};
