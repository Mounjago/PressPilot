/**
 * CONSTANTES DE ROLES ET INTERFACES
 * Systeme de roles multi-workspace pour PressPilot
 *
 * Interfaces:
 *   - press_agent: Attaches de presse (gestion artistes + campagnes medias)
 *   - bandstream_rp: BandStream RP interne (RP corporate, pas d'artistes)
 *
 * Roles:
 *   - press_agent: Acces uniquement a l'interface Attaches de presse
 *   - bandstream_rp: Acces uniquement a l'interface BandStream RP
 *   - admin: Acces aux deux interfaces + gestion utilisateurs
 *   - super_admin: Acces total + configuration systeme
 */

// --- Roles ---
const ROLES = {
  PRESS_AGENT: 'press_agent',
  BANDSTREAM_RP: 'bandstream_rp',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

const ROLES_LIST = Object.values(ROLES);

// --- Interfaces / Workspaces ---
const INTERFACES = {
  PRESS: 'press',       // Interface Attaches de presse
  RP: 'rp'              // Interface BandStream RP
};

const INTERFACES_LIST = Object.values(INTERFACES);

// --- Mapping Role -> Interfaces accessibles ---
const ROLE_INTERFACE_ACCESS = {
  [ROLES.PRESS_AGENT]: [INTERFACES.PRESS],
  [ROLES.BANDSTREAM_RP]: [INTERFACES.RP],
  [ROLES.ADMIN]: [INTERFACES.PRESS, INTERFACES.RP],
  [ROLES.SUPER_ADMIN]: [INTERFACES.PRESS, INTERFACES.RP]
};

// --- Hierarchie des roles (pour requireMinRole) ---
// Plus le nombre est eleve, plus le role est puissant
const ROLE_HIERARCHY = {
  [ROLES.PRESS_AGENT]: 1,
  [ROLES.BANDSTREAM_RP]: 1,
  [ROLES.ADMIN]: 10,
  [ROLES.SUPER_ADMIN]: 100
};

// --- Types de campagnes ---
const CAMPAIGN_TYPES = {
  ARTIST_PROMO: 'artist_promo',       // Promotion artiste (press_agent)
  CORPORATE_PR: 'corporate_pr',       // RP corporate (bandstream_rp)
  EVENT_PROMO: 'event_promo',         // Promotion evenement (bandstream_rp)
  PRODUCT_LAUNCH: 'product_launch'    // Lancement produit (bandstream_rp)
};

const CAMPAIGN_TYPES_LIST = Object.values(CAMPAIGN_TYPES);

// --- Mapping CampaignType -> Interface ---
const CAMPAIGN_TYPE_INTERFACE = {
  [CAMPAIGN_TYPES.ARTIST_PROMO]: INTERFACES.PRESS,
  [CAMPAIGN_TYPES.CORPORATE_PR]: INTERFACES.RP,
  [CAMPAIGN_TYPES.EVENT_PROMO]: INTERFACES.RP,
  [CAMPAIGN_TYPES.PRODUCT_LAUNCH]: INTERFACES.RP
};

// --- Visibilite des contacts ---
const CONTACT_VISIBILITY = {
  PRIVATE: 'private',           // Visible uniquement par le createur
  ORGANIZATION: 'organization', // Visible par tous les membres de l'organisation
  SHARED_POOL: 'shared_pool'   // Visible par tous (lecture seule sauf createur)
};

const CONTACT_VISIBILITY_LIST = Object.values(CONTACT_VISIBILITY);

// --- Mapping legacy roles -> nouveaux roles ---
const LEGACY_ROLE_MAP = {
  'user': ROLES.PRESS_AGENT,
  'moderator': ROLES.BANDSTREAM_RP,
  'admin': ROLES.ADMIN
};

// --- Labels d'interface (pour l'affichage) ---
const INTERFACE_META = {
  [INTERFACES.PRESS]: {
    label: 'Attaches de presse',
    description: 'Gestion des relations presse pour les artistes',
    accentColor: '#6366f1', // indigo-500
    cssClass: 'workspace-press',
    basePath: '/press',
    icon: 'music-note'
  },
  [INTERFACES.RP]: {
    label: 'BandStream RP',
    description: 'Relations publiques internes BandStream',
    accentColor: '#10b981', // emerald-500
    cssClass: 'workspace-rp',
    basePath: '/rp',
    icon: 'megaphone'
  }
};

// --- Helpers ---

/**
 * Verifie si un role a acces a une interface donnee
 */
function canAccessInterface(role, interfaceName) {
  const allowedInterfaces = ROLE_INTERFACE_ACCESS[role];
  if (!allowedInterfaces) return false;
  return allowedInterfaces.includes(interfaceName);
}

/**
 * Verifie si un role est au moins aussi puissant qu'un autre
 */
function isMinRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Verifie si un role est admin ou super_admin
 */
function isAdminRole(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/**
 * Retourne les interfaces accessibles pour un role
 */
function getInterfacesForRole(role) {
  return ROLE_INTERFACE_ACCESS[role] || [];
}

/**
 * Retourne l'interface associee a un type de campagne
 */
function getInterfaceForCampaignType(campaignType) {
  return CAMPAIGN_TYPE_INTERFACE[campaignType] || null;
}

/**
 * Convertit un ancien role en nouveau role
 */
function mapLegacyRole(legacyRole) {
  return LEGACY_ROLE_MAP[legacyRole] || legacyRole;
}

module.exports = {
  ROLES,
  ROLES_LIST,
  INTERFACES,
  INTERFACES_LIST,
  ROLE_INTERFACE_ACCESS,
  ROLE_HIERARCHY,
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPES_LIST,
  CAMPAIGN_TYPE_INTERFACE,
  CONTACT_VISIBILITY,
  CONTACT_VISIBILITY_LIST,
  LEGACY_ROLE_MAP,
  INTERFACE_META,
  canAccessInterface,
  isMinRole,
  isAdminRole,
  getInterfacesForRole,
  getInterfaceForCampaignType,
  mapLegacyRole
};
