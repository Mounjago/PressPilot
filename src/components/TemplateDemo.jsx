import React, { useState } from 'react';
import { Play, FileText, Mic, Star, Music, Calendar, RotateCcw } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import VariableManager from './VariableManager';
import TemplatePreview from './TemplatePreview';

const TemplateDemo = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  // Données de démo
  const demoData = {
    artistName: 'Luna Rosa',
    projectName: 'Midnight Dreams',
    projectType: 'Album',
    releaseDate: '2024-12-01',
    label: 'Indie Records',
    genre: 'Indie Pop',
    description: 'Un voyage sonore à travers les rêves nocturnes, mêlant pop éthérée et synthés vintage. Luna Rosa nous emmène dans un univers onirique où chaque titre raconte une histoire unique.',
    contactName: 'Marie Dubois',
    contactEmail: 'marie.dubois@presspilot.com',
    contactPhone: '+33 1 42 35 67 89',
    epkLink: 'https://presspilot.com/epk/luna-rosa-midnight-dreams',
    websiteUrl: 'https://lunarosa-music.com',
    spotifyUrl: 'https://open.spotify.com/artist/lunarosa',
    youtubeUrl: 'https://youtube.com/lunarosamusic',
    instagramUrl: 'https://instagram.com/lunarosa.music'
  };

  const templates = [
    {
      id: 'communique',
      name: 'Communiqué de presse',
      icon: FileText,
      description: 'Format officiel pour annoncer une sortie ou actualité',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'teaser',
      name: 'Teaser / Annonce',
      icon: Play,
      description: 'Format court et percutant pour créer l\'attente',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      id: 'interview',
      name: 'Demande d\'interview',
      icon: Mic,
      description: 'Template personnalisé pour solliciter les journalistes',
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'review',
      name: 'Demande de chronique',
      icon: Star,
      description: 'Format spécialisé pour les demandes de review',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'premiere',
      name: 'Première exclusive',
      icon: Star,
      description: 'Template premium pour les exclusivités médias',
      color: 'bg-red-50 border-red-200'
    },
    {
      id: 'playlist',
      name: 'Demande playlist',
      icon: Music,
      description: 'Spécialisé pour les curateurs et programmateurs',
      color: 'bg-indigo-50 border-indigo-200'
    },
    {
      id: 'live',
      name: 'Invitation concert',
      icon: Calendar,
      description: 'Template événementiel avec informations pratiques',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'follow-up',
      name: 'Relance presse',
      icon: RotateCcw,
      description: 'Template de suivi courtois et professionnel',
      color: 'bg-gray-50 border-gray-200'
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setTemplateVariables(demoData);
    setCurrentStep(2);
  };

  const handleVariablesChange = (variables) => {
    setTemplateVariables(variables);
    setCurrentStep(3);
  };

  const steps = [
    { number: 1, title: 'Sélection du template', description: 'Choisissez le type de campagne' },
    { number: 2, title: 'Configuration', description: 'Personnalisez les variables' },
    { number: 3, title: 'Prévisualisation', description: 'Vérifiez le rendu final' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Templates Professionnels PressPilot
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Découvrez notre collection de templates email professionnels conçus spécialement
          pour les attachés de presse musicale. Chaque template est optimisé pour maximiser
          l'impact de vos campagnes.
        </p>
      </div>

      {/* Indicateur de progression */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.number
                  ? 'bg-[#0ED894] text-white'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.number}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 h-0.5 bg-gray-200 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Étape 1: Sélection du template */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Choisissez votre template
            </h2>
            <p className="text-gray-600">
              Sélectionnez le type de campagne qui correspond à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => {
              const IconComponent = template.icon;

              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                    hover:shadow-lg hover:scale-105 ${template.color}
                  `}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <IconComponent className="w-6 h-6 text-gray-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Étape 2: Configuration des variables */}
      {currentStep === 2 && selectedTemplate && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Configurez votre template
            </h2>
            <p className="text-gray-600">
              Personnalisez les informations qui apparaîtront dans votre email
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <selectedTemplate.icon className="w-6 h-6 text-[#0ED894]" />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
            </div>

            <VariableManager
              campaignType={selectedTemplate.id}
              onVariablesChange={handleVariablesChange}
              initialVariables={demoData}
            />

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-[#0ED894] text-white font-medium rounded-lg hover:bg-[#0ED894]/90 transition-colors"
              >
                Voir la prévisualisation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3: Prévisualisation */}
      {currentStep === 3 && selectedTemplate && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Prévisualisation de votre email
            </h2>
            <p className="text-gray-600">
              Voici comment votre email apparaîtra aux destinataires
            </p>
          </div>

          <TemplatePreview
            templateType={selectedTemplate.id}
            variables={templateVariables}
            showPreview={true}
            onExportHTML={(html) => console.log('HTML exporté:', html)}
          />

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Modifier les variables
            </button>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setTemplateVariables({});
                setCurrentStep(1);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Choisir un autre template
            </button>
          </div>
        </div>
      )}

      {/* Fonctionnalités */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#0ED894]/10 rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#0ED894]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Templates Professionnels</h3>
          <p className="text-gray-600">
            8 templates spécialement conçus pour la presse musicale, du communiqué à la relance.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#0ED894]/10 rounded-lg flex items-center justify-center">
            <Star className="w-8 h-8 text-[#0ED894]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Variables Dynamiques</h3>
          <p className="text-gray-600">
            Personnalisez automatiquement vos emails avec les informations de l'artiste et du projet.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#0ED894]/10 rounded-lg flex items-center justify-center">
            <Play className="w-8 h-8 text-[#0ED894]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aperçu en Temps Réel</h3>
          <p className="text-gray-600">
            Visualisez instantanément le rendu final sur desktop, tablette et mobile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateDemo;