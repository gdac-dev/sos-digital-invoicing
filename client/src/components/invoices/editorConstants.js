// Color palettes
export const PALETTES = {
  skyblue:  { name: 'Bleu ciel',    primary: '#0EA5E9', dark: '#0369A1', accent: '#BAE6FD', text: '#0f172a' },
  violet:   { name: 'Violet',       primary: '#7C3AED', dark: '#5B21B6', accent: '#DDD6FE', text: '#0f172a' },
  emerald:  { name: 'Émeraude',     primary: '#059669', dark: '#047857', accent: '#A7F3D0', text: '#0f172a' },
  orange:   { name: 'Orange',       primary: '#EA580C', dark: '#C2410C', accent: '#FED7AA', text: '#0f172a' },
  rose:     { name: 'Rose',         primary: '#E11D48', dark: '#BE123C', accent: '#FECDD3', text: '#0f172a' },
  brown:    { name: 'Brun',         primary: '#78350F', dark: '#451A03', accent: '#FDE68A', text: '#0f172a' },
  slate:    { name: 'Ardoise',      primary: '#334155', dark: '#0F172A', accent: '#CBD5E1', text: '#0f172a' },
  gold:     { name: 'Or',           primary: '#B45309', dark: '#92400E', accent: '#FDE68A', text: '#0f172a' },
};

export const FONTS = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Trebuchet MS'];

export const TEMPLATES = {
  elegant:  'Élégant (défaut)',
  classic:  'Classique',
  modern:   'Moderne',
  minimal:  'Minimaliste',
};

export const WATERMARK_STYLES = ['Texte estompé', 'Contour', 'Diagonal'];
export const WATERMARK_POSITIONS = ['Centre de la page', 'Haut gauche', 'Bas droite'];

export const CURRENCIES = ['FCFA', 'EUR', 'USD', 'GBP', 'CAD'];
export const PAYMENT_METHODS = ['Virement', 'Espèces', 'Chèque', 'Mobile Money', 'Carte bancaire'];
export const UNITS = ['Unité', 'Heure', 'Jour', 'Forfait', 'Mois', 'kg', 'm²', 'm'];

export const INITIAL_DESIGN = {
  docTitle: 'FACTURE',
  template: 'elegant',
  palette: 'skyblue',
  font: 'Inter',
  watermark: { type: 'none', text: 'BROUILLON', style: 'Texte estompé', position: 'Centre de la page', size: 80, opacity: 30 },
  stamp: { image: null, size: 150, opacity: 100, x: 70, y: 75, placing: false },
};

export const INITIAL_COMPANY = {
  name: 'SOS DIGITAL', address: '123 Rue Exemple', city: 'Douala', country: 'Cameroun',
  phone: '+237 653 522 435', email: 'contact@sosdigital.cm', taxId: '',
  logo: '/logo.jpeg', activity: 'Facturation & Services Numériques',
};

export const INITIAL_CLIENT = { name: '', address: '', city: '', phone: '', email: '' };

export const INITIAL_DETAILS = {
  number: '', date: new Date().toISOString().split('T')[0],
  validity: '30', reference: '', paymentMethod: 'Virement',
  currency: 'FCFA', dueDate: '', language: 'fr',
};

export const EMPTY_SECTION = { title: '', items: [] };
export const EMPTY_ITEM = { description: '', unit: 'Unité', qty: 1, unitPrice: 0 };
