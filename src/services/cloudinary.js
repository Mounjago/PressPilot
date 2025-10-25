/**
 * SERVICE CLOUDINARY - Upload d'images vers le cloud
 * Gestion sécurisée des uploads d'avatars et covers
 */

// Configuration Cloudinary
const CLOUDINARY_CONFIG = {
  cloudName: 'presspilot', // Remplacez par votre cloud name
  apiKey: '157592992482694',
  uploadPreset: 'ml_default', // Preset unsigned par défaut
  folder: 'artists' // Dossier pour organiser les images
};

// Générateur d'ID public indevinable
const generateUniquePublicId = (originalFilename, folder) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const cleanFilename = originalFilename
    .replace(/\.[^/.]+$/, '') // Supprimer l'extension
    .replace(/[^a-zA-Z0-9]/g, '_') // Remplacer caractères spéciaux par _
    .toLowerCase();

  return `${folder}/${cleanFilename}_${timestamp}_${randomString}`;
};

/**
 * Upload une image vers Cloudinary
 * @param {File} file - Fichier image à uploader
 * @param {string} folder - Dossier de destination (artists, projects, covers)
 * @param {Function} onProgress - Callback pour le suivi du progrès
 * @returns {Promise<Object>} - URL et métadonnées de l'image uploadée
 */
// Alternative avec le widget Cloudinary
export const uploadImageWithWidget = async (onSuccess, onError) => {
  return new Promise((resolve, reject) => {
    if (!window.cloudinary) {
      // Charger le script Cloudinary si pas encore chargé
      const script = document.createElement('script');
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.onload = () => initWidget();
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    function initWidget() {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CONFIG.cloudName,
          uploadPreset: 'ml_default',
          folder: 'images/artistes',
          sources: ['local'],
          maxFiles: 1,
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          maxFileSize: 10000000, // 10MB
        },
        (error, result) => {
          if (error) {
            console.error('Widget error:', error);
            reject(error);
            if (onError) onError(error);
          }

          if (result && result.event === 'success') {
            console.log('✅ Upload réussi:', result.info);
            const imageData = {
              url: result.info.secure_url,
              publicId: result.info.public_id,
              displayName: result.info.original_filename,
              originalFilename: result.info.original_filename,
              width: result.info.width,
              height: result.info.height,
              format: result.info.format,
              bytes: result.info.bytes,
              created: result.info.created_at
            };
            resolve(imageData);
            if (onSuccess) onSuccess(imageData);
          }
        }
      );

      widget.open();
    }
  });
};

export const uploadImageToCloudinary = async (file, folder = 'artists', onProgress = null) => {
  try {
    // Validation du fichier
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image valide');
    }

    // Limite de taille (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('L\'image ne doit pas dépasser 10MB');
    }

    // Générer un ID public unique et indevinable
    const uniquePublicId = generateUniquePublicId(file.name, folder);

    // Extraire le nom du fichier sans extension pour le display name
    const displayName = file.name.replace(/\.[^/.]+$/, '');

    // Préparer les données pour l'upload avec debugging complet
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // Debug: afficher tous les paramètres envoyés
    console.log('📋 Données envoyées à Cloudinary:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }

    // Debug complet
    console.log('📤 Configuration Cloudinary:', {
      cloudName: CLOUDINARY_CONFIG.cloudName,
      uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // URL complète pour debug
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    console.log('🌐 URL d\'upload:', uploadUrl);

    // Créer une promesse avec suivi du progrès
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Suivi du progrès
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      // Gestion de la réponse
      xhr.addEventListener('load', () => {
        console.log('🔍 Réponse Cloudinary:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText
        });

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload réussi:', response);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              displayName: response.display_name || displayName,
              originalFilename: file.name,
              width: response.width,
              height: response.height,
              format: response.format,
              bytes: response.bytes,
              created: response.created_at,
              etag: response.etag
            });
          } catch (error) {
            console.error('❌ Erreur de parsing:', error);
            reject(new Error('Erreur lors du parsing de la réponse Cloudinary'));
          }
        } else {
          console.error('❌ Erreur HTTP:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
          reject(new Error(`Erreur HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Gestion des erreurs
      xhr.addEventListener('error', () => {
        reject(new Error('Erreur réseau lors de l\'upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Timeout lors de l\'upload'));
      });

      // Configuration et envoi
      xhr.open('POST', uploadUrl);
      xhr.timeout = 60000; // 60 secondes
      xhr.send(formData);
    });

  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};

/**
 * Supprimer une image de Cloudinary
 * @param {string} publicId - ID public de l'image à supprimer
 * @returns {Promise<boolean>} - Succès de la suppression
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    // Note: La suppression nécessite une API signée côté serveur
    // Pour l'instant, on log juste l'intention de suppression
    console.log('Suppression demandée pour:', publicId);

    // TODO: Implémenter la suppression côté serveur
    // Cette opération nécessite l'API secret qui ne doit pas être exposée côté client

    return true;
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    return false;
  }
};

/**
 * Générer une URL Cloudinary avec transformations
 * @param {string} publicId - ID public de l'image
 * @param {Object} options - Options de transformation
 * @returns {string} - URL transformée
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  const {
    width = 400,
    height = 400,
    crop = 'fill',
    gravity = 'face',
    format = 'auto',
    quality = 'auto'
  } = options;

  const transformation = `w_${width},h_${height},c_${crop},g_${gravity},f_${format},q_${quality}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformation}/${publicId}`;
};

/**
 * Optimiser une URL d'image existante via Cloudinary
 * @param {string} imageUrl - URL de l'image à optimiser
 * @param {Object} options - Options de transformation
 * @returns {string} - URL optimisée
 */
export const optimizeImageUrl = (imageUrl, options = {}) => {
  const {
    width = 400,
    height = 400,
    crop = 'fill',
    format = 'auto',
    quality = 'auto'
  } = options;

  const transformation = `w_${width},h_${height},c_${crop},f_${format},q_${quality}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/fetch/${transformation}/${encodeURIComponent(imageUrl)}`;
};

/**
 * Valider si une URL est une image Cloudinary
 * @param {string} url - URL à valider
 * @returns {boolean} - True si c'est une URL Cloudinary
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com');
};

/**
 * Extraire le public ID d'une URL Cloudinary
 * @param {string} url - URL Cloudinary
 * @returns {string|null} - Public ID ou null
 */
export const extractPublicId = (url) => {
  try {
    if (!isCloudinaryUrl(url)) return null;

    const matches = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    return null;
  }
};

export default {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  getCloudinaryUrl,
  optimizeImageUrl,
  isCloudinaryUrl,
  extractPublicId
};