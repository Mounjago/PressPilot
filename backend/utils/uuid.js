/**
 * UUID v4 Generator
 * Implémentation native sans dépendance externe
 */

const crypto = require('crypto');

/**
 * Génère un UUID v4 conforme à RFC 4122
 * @returns {string} UUID v4
 */
function uuidv4() {
  // Générer 16 bytes aléatoires
  const bytes = crypto.randomBytes(16);

  // Définir la version (4) dans les bits 12-15 du 7ème byte
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Définir la variante (10) dans les bits 6-7 du 9ème byte
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Convertir en string avec format UUID
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

module.exports = { uuidv4 };