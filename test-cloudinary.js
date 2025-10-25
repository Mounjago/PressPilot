const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration Cloudinary
const CLOUDINARY_CONFIG = {
  cloudName: 'presspilot',
  uploadPreset: 'presspilot_unsigned'
};

async function testCloudinaryUpload() {
  try {
    console.log('🧪 Test d\'upload Cloudinary...');

    // Chemin vers une image de test
    const imagePath = '/Users/denisadam/Downloads/045aa7b9-7234-4f18-af15-849d2480cce7.jpeg';

    // Vérifier que le fichier existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Fichier non trouvé: ${imagePath}`);
    }

    const imageStats = fs.statSync(imagePath);
    console.log(`📁 Image: ${imagePath}`);
    console.log(`📏 Taille: ${imageStats.size} bytes`);

    // Créer FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // URL d'upload
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    console.log(`🌐 URL d'upload: ${uploadUrl}`);

    // Effectuer l'upload
    console.log('📤 Upload en cours...');
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log('📝 Réponse complète:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Upload réussi!');
      console.log(`🔗 URL: ${result.secure_url}`);
      console.log(`🆔 Public ID: ${result.public_id}`);
    } else {
      console.log('❌ Erreur d\'upload');
      try {
        const errorData = JSON.parse(responseText);
        console.log('💥 Détails de l\'erreur:', errorData);
      } catch (e) {
        console.log('💥 Erreur brute:', responseText);
      }
    }

  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

// Lancer le test
testCloudinaryUpload();