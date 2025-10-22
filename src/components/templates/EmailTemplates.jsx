import React from 'react';

// Variables dynamiques par défaut
const defaultVariables = {
  artistName: 'Nom de l\'artiste',
  projectName: 'Titre du projet',
  projectType: 'Album',
  releaseDate: '01/01/2024',
  label: 'Label',
  genre: 'Pop',
  description: 'Description du projet...',
  contactName: 'Prénom Nom',
  contactEmail: 'contact@presspilot.com',
  contactPhone: '+33 1 23 45 67 89',
  epkLink: 'https://presspilot.com/epk/123',
  websiteUrl: 'https://artiste.com',
  spotifyUrl: 'https://open.spotify.com/artist/123',
  youtubeUrl: 'https://youtube.com/artiste',
  instagramUrl: 'https://instagram.com/artiste',
  venue: 'Nom de la salle',
  venueAddress: 'Adresse de la salle',
  eventDate: '01/01/2024',
  eventTime: '20h00',
  deadline: '01/01/2024',
  exclusivityPeriod: '48h'
};

// Template base avec header et footer personnalisables
const TemplateWrapper = ({ children, variables = {}, branding = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  // Configuration de marque par défaut
  const brand = {
    companyName: branding.companyName || 'PressPilot',
    subtitle: branding.subtitle || 'CRM Presse Musicale',
    primaryColor: branding.primaryColor || '#0ED894',
    backgroundColor: branding.backgroundColor || '#000000',
    textColor: branding.textColor || '#ffffff',
    ...branding
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333333',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff'
    }}>
      {/* Header personnalisable */}
      <div style={{
        backgroundColor: brand.backgroundColor,
        color: brand.textColor,
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          {brand.companyName}
        </div>
        <div style={{
          fontSize: '14px',
          color: brand.primaryColor,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {brand.subtitle}
        </div>
      </div>

      {/* Contenu du template */}
      <div style={{ padding: '0' }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '30px 20px',
        borderTop: `3px solid ${brand.primaryColor}`,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#333333',
          marginBottom: '10px'
        }}>
          {vars.contactName}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#666666',
          marginBottom: '15px'
        }}>
          Attaché(e) de presse • {brand.companyName}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#666666',
          lineHeight: '1.4'
        }}>
          Email : {vars.contactEmail}<br />
          Tél : {vars.contactPhone}
        </div>
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef',
          fontSize: '12px',
          color: '#999999'
        }}>
          Powered by PressPilot - CRM Presse Musicale
        </div>
      </div>
    </div>
  );
};

// 1. Template Communiqué de presse
export const CommuniqueTemplate = ({ variables = {}, branding = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables} branding={branding}>
      <div style={{ padding: '40px 30px' }}>
        {/* Badge Communiqué */}
        <div style={{
          backgroundColor: '#0ED894',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'inline-block',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '30px'
        }}>
          Communiqué de presse
        </div>

        {/* Titre principal */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#000000',
          lineHeight: '1.3',
          marginBottom: '20px'
        }}>
          {vars.artistName} dévoile "{vars.projectName}"
        </h1>

        {/* Sous-titre */}
        <div style={{
          fontSize: '18px',
          color: '#666666',
          marginBottom: '30px',
          fontStyle: 'italic'
        }}>
          Nouveau {vars.projectType} disponible le {vars.releaseDate}
        </div>

        {/* Corps du communiqué */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333',
          marginBottom: '40px'
        }}>
          <p style={{ marginBottom: '20px' }}>
            <strong>{vars.artistName}</strong> annonce officiellement la sortie de son nouveau {vars.projectType.toLowerCase()}
            intitulé "<strong>{vars.projectName}</strong>", prévu pour le <strong>{vars.releaseDate}</strong>
            chez {vars.label}.
          </p>

          <p style={{ marginBottom: '20px' }}>
            {vars.description}
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cette nouvelle création confirme la position de {vars.artistName} sur la scène {vars.genre.toLowerCase()}
            française et marque une étape importante dans sa carrière artistique.
          </p>
        </div>

        {/* Informations techniques */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Informations
          </h3>
          <div style={{ fontSize: '14px', color: '#666666' }}>
            <div style={{ marginBottom: '8px' }}><strong>Artiste :</strong> {vars.artistName}</div>
            <div style={{ marginBottom: '8px' }}><strong>Titre :</strong> {vars.projectName}</div>
            <div style={{ marginBottom: '8px' }}><strong>Format :</strong> {vars.projectType}</div>
            <div style={{ marginBottom: '8px' }}><strong>Date de sortie :</strong> {vars.releaseDate}</div>
            <div style={{ marginBottom: '8px' }}><strong>Label :</strong> {vars.label}</div>
            <div><strong>Genre :</strong> {vars.genre}</div>
          </div>
        </div>

        {/* EPK */}
        <div style={{
          backgroundColor: '#0ED894',
          background: 'linear-gradient(135deg, #0ED894 0%, #0bc77a 100%)',
          padding: '25px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Dossier de presse complet
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Photos HD, biographie, extraits audio et plus
          </div>
          <a href={vars.epkLink} style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#0ED894',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Accéder à l'EPK
          </a>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// 2. Template Teaser/Annonce
export const TeaserTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px', textAlign: 'center' }}>
        {/* Badge Teaser */}
        <div style={{
          backgroundColor: '#ff6b35',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'inline-block',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '30px'
        }}>
          Teaser exclusif
        </div>

        {/* Titre accrocheur */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#000000',
          lineHeight: '1.2',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          C'est bientôt...
        </h1>

        {/* Artwork/Visual placeholder */}
        <div style={{
          width: '300px',
          height: '300px',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #0ED894',
          borderRadius: '8px',
          margin: '30px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: '#666666'
        }}>
          [Artwork "{vars.projectName}"]
        </div>

        {/* Annonce */}
        <div style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#333333',
          marginBottom: '15px'
        }}>
          {vars.artistName}
        </div>

        <div style={{
          fontSize: '20px',
          color: '#0ED894',
          fontWeight: '600',
          marginBottom: '30px'
        }}>
          "{vars.projectName}"
        </div>

        {/* Date de sortie prominente */}
        <div style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            Disponible le
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0ED894'
          }}>
            {vars.releaseDate}
          </div>
        </div>

        {/* Message teaser */}
        <div style={{
          fontSize: '16px',
          color: '#666666',
          lineHeight: '1.6',
          marginBottom: '40px',
          fontStyle: 'italic'
        }}>
          {vars.description || `Préparez-vous à découvrir l'univers unique de ${vars.artistName}. Plus d'informations très bientôt...`}
        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Restez informé(e)
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            marginBottom: '15px'
          }}>
            Le dossier de presse complet sera disponible prochainement
          </div>
          <a href={vars.epkLink} style={{
            display: 'inline-block',
            backgroundColor: '#0ED894',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Accéder aux infos
          </a>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// 3. Template Demande d'interview
export const InterviewTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px' }}>
        {/* En-tête personnalisé */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#0ED894',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}>
            Demande d'interview
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#000000'
          }}>
            {vars.artistName} • "{vars.projectName}"
          </div>
        </div>

        {/* Message personnalisé */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333',
          marginBottom: '30px'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Bonjour,
          </p>

          <p style={{ marginBottom: '20px' }}>
            J'espère que vous allez bien. Je me permets de vous contacter concernant
            <strong> {vars.artistName}</strong>, artiste que nous accompagnons et qui sort
            son nouveau {vars.projectType.toLowerCase()} "<strong>{vars.projectName}</strong>"
            le <strong>{vars.releaseDate}</strong>.
          </p>

          <p style={{ marginBottom: '20px' }}>
            {vars.description}
          </p>

          <p style={{ marginBottom: '20px' }}>
            Seriez-vous intéressé(e) par une interview avec {vars.artistName} ?
            L'artiste est disponible pour échanger sur ce nouveau projet, son processus créatif,
            et ses projets à venir.
          </p>
        </div>

        {/* Propositions d'angles */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Angles proposés
          </h3>
          <ul style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '8px' }}>Le processus créatif derrière "{vars.projectName}"</li>
            <li style={{ marginBottom: '8px' }}>L'évolution artistique de {vars.artistName}</li>
            <li style={{ marginBottom: '8px' }}>Les collaborations et influences du projet</li>
            <li style={{ marginBottom: '8px' }}>Les projets live et la tournée à venir</li>
          </ul>
        </div>

        {/* Modalités */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '10px'
            }}>
              Disponibilités
            </h4>
            <div style={{ fontSize: '14px', color: '#666666' }}>
              Flexible selon vos créneaux<br />
              En présentiel ou visio
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '10px'
            }}>
            Durée
            </h4>
            <div style={{ fontSize: '14px', color: '#666666' }}>
              15 à 30 minutes<br />
              Selon vos besoins
            </div>
          </div>
        </div>

        {/* EPK */}
        <div style={{
          backgroundColor: '#0ED894',
          background: 'linear-gradient(135deg, #0ED894 0%, #0bc77a 100%)',
          padding: '25px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Dossier de presse complet
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Bio, photos HD, extraits audio pour préparer l'interview
          </div>
          <a href={vars.epkLink} style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#0ED894',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Accéder à l'EPK
          </a>
        </div>

        {/* Message de fin */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333'
        }}>
          <p style={{ marginBottom: '20px' }}>
            N'hésitez pas à me faire savoir si cette proposition vous intéresse.
            Je reste à votre disposition pour toute information complémentaire.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Belle journée,
          </p>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// 4. Template Demande de chronique
export const ReviewTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px' }}>
        {/* En-tête */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#9c27b0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}>
            Demande de chronique
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#000000'
          }}>
            {vars.artistName} • "{vars.projectName}"
          </div>
        </div>

        {/* Message */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333',
          marginBottom: '30px'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Bonjour,
          </p>

          <p style={{ marginBottom: '20px' }}>
            J'espère que vous allez bien. Je vous écris concernant la sortie du nouveau {vars.projectType.toLowerCase()}
            de <strong>{vars.artistName}</strong>, intitulé "<strong>{vars.projectName}</strong>",
            disponible depuis le <strong>{vars.releaseDate}</strong>.
          </p>

          <p style={{ marginBottom: '20px' }}>
            {vars.description}
          </p>

          <p style={{ marginBottom: '20px' }}>
            Pensez-vous que ce projet pourrait intéresser vos lecteurs ? Seriez-vous disponible
            pour en faire la chronique dans vos colonnes ?
          </p>
        </div>

        {/* Informations de l'album */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Informations du projet
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            fontSize: '14px',
            color: '#666666'
          }}>
            <div><strong>Artiste :</strong> {vars.artistName}</div>
            <div><strong>Titre :</strong> {vars.projectName}</div>
            <div><strong>Format :</strong> {vars.projectType}</div>
            <div><strong>Genre :</strong> {vars.genre}</div>
            <div><strong>Date de sortie :</strong> {vars.releaseDate}</div>
            <div><strong>Label :</strong> {vars.label}</div>
          </div>
        </div>

        {/* Liens d'écoute */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e9ecef',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Écouter le projet
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            <a href={vars.spotifyUrl} style={{
              display: 'block',
              backgroundColor: '#1db954',
              color: '#ffffff',
              padding: '10px 15px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Spotify
            </a>
            <a href={vars.youtubeUrl} style={{
              display: 'block',
              backgroundColor: '#ff0000',
              color: '#ffffff',
              padding: '10px 15px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              YouTube
            </a>
            <a href={vars.websiteUrl} style={{
              display: 'block',
              backgroundColor: '#333333',
              color: '#ffffff',
              padding: '10px 15px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Site officiel
            </a>
          </div>
        </div>

        {/* EPK */}
        <div style={{
          backgroundColor: '#9c27b0',
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          padding: '25px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Dossier de presse complet
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Bio, photos HD, historique discographique, revues de presse
          </div>
          <a href={vars.epkLink} style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#9c27b0',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Télécharger l'EPK
          </a>
        </div>

        {/* Message de fin */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Je vous envoie en parallèle le lien d'écoute sécurisé si vous souhaitez découvrir
            le projet avant sa sortie officielle.
          </p>

          <p style={{ marginBottom: '20px' }}>
            N'hésitez pas à me faire savoir si vous avez besoin d'informations complémentaires.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cordialement,
          </p>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// 5. Template Première exclusive
export const PremiereTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px' }}>
        {/* Badge Exclusivité */}
        <div style={{
          backgroundColor: '#dc2626',
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          color: '#ffffff',
          padding: '15px 25px',
          borderRadius: '25px',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
        }}>
          Première exclusive
        </div>

        {/* Titre premium */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#000000',
          lineHeight: '1.3',
          marginBottom: '20px'
        }}>
          Première exclusive : {vars.artistName} dévoile "{vars.projectName}"
        </h1>

        {/* Message d'exclusivité */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#dc2626',
            marginBottom: '10px'
          }}>
            Contenu exclusif pour votre média
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6'
          }}>
            Vous êtes le/la premier(e) à recevoir ce contenu. Exclusivité de <strong>{vars.exclusivityPeriod || '48h'}</strong>
            avant diffusion aux autres médias. Deadline de publication : <strong>{vars.deadline}</strong>
          </div>
        </div>

        {/* Message personnalisé */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333',
          marginBottom: '30px'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Bonjour,
          </p>

          <p style={{ marginBottom: '20px' }}>
            J'ai le plaisir de vous proposer une <strong>première exclusive</strong> concernant
            le nouveau {vars.projectType.toLowerCase()} de <strong>{vars.artistName}</strong>,
            intitulé "<strong>{vars.projectName}</strong>".
          </p>

          <p style={{ marginBottom: '20px' }}>
            {vars.description}
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cette exclusivité comprend l'accès prioritaire au contenu, aux visuels HD,
            et la possibilité d'une interview exclusive avec l'artiste si vous le souhaitez.
          </p>
        </div>

        {/* Contenu exclusif */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Contenu de l'exclusivité
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            fontSize: '14px',
            color: '#666666'
          }}>
            <div>✓ Écoute en avant-première</div>
            <div>✓ Photos exclusives HD</div>
            <div>✓ Interview prioritaire</div>
            <div>✓ Citation exclusive de l'artiste</div>
            <div>✓ Informations inédites</div>
            <div>✓ Visuels pour publication</div>
          </div>
        </div>

        {/* Modalités d'exclusivité */}
        <div style={{
          backgroundColor: '#fff8f1',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#f59e0b',
            marginBottom: '15px'
          }}>
            Modalités de l'exclusivité
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Durée d'exclusivité :</strong> {vars.exclusivityPeriod || '48 heures'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Deadline de publication :</strong> {vars.deadline}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Format suggéré :</strong> Article, interview, chronique
            </div>
            <div>
              <strong>Mention suggérée :</strong> "En exclusivité pour [Nom du média]"
            </div>
          </div>
        </div>

        {/* EPK Premium */}
        <div style={{
          backgroundColor: '#dc2626',
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          padding: '25px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Accès privilégié EPK Premium
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Contenu exclusif, photos inédites, extraits audio en avant-première
          </div>
          <a href={vars.epkLink} style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#dc2626',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Accès exclusif EPK
          </a>
        </div>

        {/* Message de fin */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Cette proposition vous intéresse-t-elle ? Je peux vous envoyer immédiatement
            les éléments pour préparer votre article.
          </p>

          <p style={{ marginBottom: '20px' }}>
            N'hésitez pas à me contacter rapidement pour confirmer votre intérêt,
            cette exclusivité étant proposée en priorité.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cordialement,
          </p>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// Export de tous les templates
export const emailTemplates = {
  communique: CommuniqueTemplate,
  teaser: TeaserTemplate,
  interview: InterviewTemplate,
  review: ReviewTemplate,
  premiere: PremiereTemplate,
  // Les autres templates seront dans la partie 2...
};

export default emailTemplates;