import React, { useState, useEffect } from 'react';
import { Palette, Type, Eye, RotateCcw } from 'lucide-react';

const TemplateBrandingManager = ({ onBrandingChange, initialBranding = {} }) => {
  const [branding, setBranding] = useState({
    companyName: 'PressPilot',
    subtitle: 'CRM Presse Musicale',
    primaryColor: '#0ED894',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    ...initialBranding
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    onBrandingChange && onBrandingChange(branding);
  }, [branding, onBrandingChange]);

  const handleBrandingChange = (field, value) => {
    setBranding(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefault = () => {
    setBranding({
      companyName: 'PressPilot',
      subtitle: 'CRM Presse Musicale',
      primaryColor: '#0ED894',
      backgroundColor: '#000000',
      textColor: '#ffffff'
    });
  };

  const presetColors = [
    { name: 'PressPilot (Défaut)', primary: '#0ED894', bg: '#000000', text: '#ffffff' },
    { name: 'Bleu Professionnel', primary: '#3B82F6', bg: '#1E40AF', text: '#ffffff' },
    { name: 'Rouge Énergique', primary: '#EF4444', bg: '#DC2626', text: '#ffffff' },
    { name: 'Violet Créatif', primary: '#8B5CF6', bg: '#7C3AED', text: '#ffffff' },
    { name: 'Orange Dynamique', primary: '#F59E0B', bg: '#D97706', text: '#ffffff' },
    { name: 'Vert Nature', primary: '#10B981', bg: '#059669', text: '#ffffff' },
    { name: 'Rose Moderne', primary: '#EC4899', bg: '#DB2777', text: '#ffffff' },
    { name: 'Noir & Blanc', primary: '#000000', bg: '#ffffff', text: '#000000' }
  ];

  return (
    <div className="chart-card" style={{ marginBottom: '20px' }}>
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Personnalisation du template</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Personnalisez l'apparence des emails avec votre image de marque
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Eye style={{ width: '16px', height: '16px' }} />
            {showPreview ? 'Masquer' : 'Aperçu'}
          </button>
          <button
            onClick={resetToDefault}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw style={{ width: '16px', height: '16px' }} />
            Réinitialiser
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '30px' }}>
        {/* Configuration */}
        <div>
          {/* Informations de base */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Type style={{ width: '18px', height: '18px' }} />
              Informations de marque
            </h4>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={branding.companyName}
                  onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                  placeholder="Ex: Mon Label, Mon Agence..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Sous-titre
                </label>
                <input
                  type="text"
                  value={branding.subtitle}
                  onChange={(e) => handleBrandingChange('subtitle', e.target.value)}
                  placeholder="Ex: Attaché de Presse, Label Indépendant..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Couleurs personnalisées */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Palette style={{ width: '18px', height: '18px' }} />
              Couleurs personnalisées
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Couleur principale
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Arrière-plan
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={branding.backgroundColor}
                    onChange={(e) => handleBrandingChange('backgroundColor', e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={branding.backgroundColor}
                    onChange={(e) => handleBrandingChange('backgroundColor', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Texte
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={branding.textColor}
                    onChange={(e) => handleBrandingChange('textColor', e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={branding.textColor}
                    onChange={(e) => handleBrandingChange('textColor', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Presets de couleurs */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px'
            }}>
              Thèmes prédéfinis
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {presetColors.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setBranding(prev => ({
                    ...prev,
                    primaryColor: preset.primary,
                    backgroundColor: preset.bg,
                    textColor: preset.text
                  }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '3px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: preset.primary,
                      borderRadius: '2px'
                    }}></div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: preset.bg,
                      borderRadius: '2px'
                    }}></div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: preset.text,
                      borderRadius: '2px'
                    }}></div>
                  </div>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aperçu */}
        {showPreview && (
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px'
            }}>
              Aperçu du header
            </h4>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                backgroundColor: branding.backgroundColor,
                color: branding.textColor,
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {branding.companyName}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: branding.primaryColor,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {branding.subtitle}
                </div>
              </div>
              <div style={{
                padding: '20px',
                fontSize: '14px',
                color: '#666666'
              }}>
                Ceci est un aperçu du header de vos emails. Le contenu du template apparaîtra ici.
              </div>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderTop: `3px solid ${branding.primaryColor}`,
                textAlign: 'center',
                fontSize: '12px',
                color: '#666666'
              }}>
                Footer avec la couleur principale
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateBrandingManager;