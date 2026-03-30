// Build version pour forcer le cache invalidation
export const BUILD_VERSION = '1735562400'; // Timestamp: 2024-12-30
export const BUILD_DATE = new Date().toISOString();
export const LANDING_PAGE_VERSION = 'v2.0-new-design';

// Log version au démarrage de l'app
if (typeof window !== 'undefined') {
  console.log(`
    🚀 PressPilot Build Info:
    - Version: ${BUILD_VERSION}
    - Date: ${BUILD_DATE}
    - Landing: ${LANDING_PAGE_VERSION}
  `);
}