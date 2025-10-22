import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Download, Copy, RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';
import { emailTemplates } from './templates/EmailTemplates';
import { emailTemplatesPart2 } from './templates/EmailTemplatesPart2';

// Combine tous les templates
const allTemplates = {
  ...emailTemplates,
  ...emailTemplatesPart2
};

const TemplatePreview = ({ templateType, variables, showPreview = true, onExportHTML }) => {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef();

  // Récupérer le template correspondant
  const TemplateComponent = allTemplates[templateType];

  if (!TemplateComponent) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          Template "{templateType}" non trouvé
        </div>
      </div>
    );
  }

  // Fonctions utilitaires
  const getViewportStyles = () => {
    switch (viewMode) {
      case 'mobile':
        return { maxWidth: '375px', margin: '0 auto' };
      case 'tablet':
        return { maxWidth: '768px', margin: '0 auto' };
      default:
        return { maxWidth: '100%' };
    }
  };

  const copyToClipboard = async () => {
    if (previewRef.current) {
      const htmlContent = previewRef.current.innerHTML;
      try {
        await navigator.clipboard.writeText(htmlContent);
        // Vous pouvez ajouter une notification de succès ici
      } catch (err) {
        console.error('Erreur lors de la copie:', err);
      }
    }
  };

  const exportHTML = async () => {
    if (!previewRef.current) return;

    setIsExporting(true);

    try {
      const htmlContent = previewRef.current.innerHTML;

      // Créer un document HTML complet pour l'export
      const fullHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email - ${variables.artistName || 'Artiste'} - ${variables.projectName || 'Projet'}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Styles responsive pour email */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
            }

            table {
                width: 100% !important;
            }

            .responsive-padding {
                padding: 20px !important;
            }

            .responsive-text {
                font-size: 16px !important;
                line-height: 1.5 !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${htmlContent}
    </div>
</body>
</html>`;

      // Télécharger le fichier HTML
      const blob = new Blob([fullHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-${templateType}-${variables.artistName || 'artiste'}-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Notifier le parent si une fonction est fournie
      if (onExportHTML) {
        onExportHTML(fullHTML);
      }

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!showPreview) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* En-tête de la prévisualisation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#0ED894]" />
          <h3 className="font-semibold text-gray-900">Prévisualisation du template</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {templateType}
          </span>
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-2">
          {/* Sélecteur de viewport */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-white text-[#0ED894] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Vue desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'tablet'
                  ? 'bg-white text-[#0ED894] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Vue tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-white text-[#0ED894] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Vue mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="Copier le HTML"
          >
            <Copy className="w-4 h-4" />
            Copier
          </button>

          <button
            onClick={exportHTML}
            disabled={isExporting}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-[#0ED894] text-white rounded-md hover:bg-[#0ED894]/90 transition-colors disabled:opacity-50"
            title="Exporter en HTML"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Export...' : 'Exporter'}
          </button>
        </div>
      </div>

      {/* Zone de prévisualisation */}
      <div className="p-4 bg-gray-50">
        {/* Indicateur de viewport */}
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            Vue {viewMode === 'desktop' ? 'desktop' : viewMode === 'tablet' ? 'tablette' : 'mobile'}
            {viewMode !== 'desktop' && (
              <span className="ml-1">
                ({viewMode === 'tablet' ? '768px' : '375px'})
              </span>
            )}
          </span>
        </div>

        {/* Conteneur de prévisualisation */}
        <div
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-300"
          style={getViewportStyles()}
        >
          <div
            ref={previewRef}
            className="template-preview-content"
          >
            <TemplateComponent variables={variables} />
          </div>
        </div>
      </div>

      {/* Informations sur l'export */}
      <div className="px-4 pb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <strong>Export email :</strong> Le template exporté est optimisé pour les clients email
            (Outlook, Gmail, Apple Mail) avec des styles inline et une compatibilité maximale.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;