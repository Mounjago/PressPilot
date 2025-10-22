import React from 'react';

// Variables dynamiques par défaut (dupliquées pour l'autonomie du fichier)
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
  exclusivityPeriod: '48h',
  bpm: '120',
  mood: 'Énergique',
  playlistName: 'Playlist Cible'
};

// Template base avec header et footer PressPilot (dupliqué pour l'autonomie)
const TemplateWrapper = ({ children, variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333333',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff'
    }}>
      {/* Header PressPilot */}
      <div style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          PressPilot
        </div>
        <div style={{
          fontSize: '14px',
          color: '#0ED894',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          CRM Presse Musicale
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
        borderTop: '3px solid #0ED894',
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
          Attaché(e) de presse • PressPilot
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

// 6. Template Demande playlist
export const PlaylistTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px' }}>
        {/* En-tête playlist */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#4f46e5',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}>
            Proposition playlist
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
            J'espère que vous allez bien. Je vous contacte en tant qu'attaché(e) de presse
            de <strong>{vars.artistName}</strong> concernant son nouveau titre
            "<strong>{vars.projectName}</strong>".
          </p>

          <p style={{ marginBottom: '20px' }}>
            {vars.description}
          </p>

          <p style={{ marginBottom: '20px' }}>
            Je pense que ce titre pourrait parfaitement s'intégrer dans vos playlists.
            Seriez-vous intéressé(e) par une écoute ?
          </p>
        </div>

        {/* Informations techniques pour playlist */}
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
            Informations techniques
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            fontSize: '14px',
            color: '#666666'
          }}>
            <div>
              <strong>Genre :</strong> {vars.genre}
            </div>
            <div>
              <strong>BPM :</strong> {vars.bpm}
            </div>
            <div>
              <strong>Mood :</strong> {vars.mood}
            </div>
            <div>
              <strong>Durée :</strong> 3:24
            </div>
            <div>
              <strong>Langue :</strong> Français
            </div>
            <div>
              <strong>Date de sortie :</strong> {vars.releaseDate}
            </div>
          </div>
        </div>

        {/* Playlist suggestions */}
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
            Playlists suggérées
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              🔥 Nouveautés
            </div>
            <div style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Genre : {vars.genre}
            </div>
            <div style={{
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Découvertes
            </div>
          </div>
        </div>

        {/* Artistes similaires */}
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
            🎭 Références artistiques
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6'
          }}>
            Ce titre s'inscrit dans la lignée d'artistes comme [Artiste 1], [Artiste 2],
            avec une approche moderne du {vars.genre.toLowerCase()}.
            L'univers sonore pourrait plaire aux auditeurs de vos playlists similaires.
          </div>
        </div>

        {/* Liens d'écoute */}
        <div style={{
          backgroundColor: '#4f46e5',
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
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
            Écouter "{vars.projectName}"
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Disponible sur toutes les plateformes
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            marginTop: '15px'
          }}>
            <a href={vars.spotifyUrl} style={{
              display: 'block',
              backgroundColor: '#ffffff',
              color: '#4f46e5',
              padding: '10px',
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
              backgroundColor: '#ffffff',
              color: '#4f46e5',
              padding: '10px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              YouTube
            </a>
          </div>
        </div>

        {/* Message de fin */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Je reste à votre disposition pour vous fournir tout matériel complémentaire
            (artwork, bio artiste, informations techniques détaillées).
          </p>

          <p style={{ marginBottom: '20px' }}>
            N'hésitez pas à me faire savoir si ce titre vous intéresse pour vos playlists.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cordialement,
          </p>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// 7. Template Invitation concert/showcase
export const LiveTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px' }}>
        {/* En-tête événement */}
        <div style={{
          backgroundColor: '#f59e0b',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          padding: '25px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            opacity: '0.9'
          }}>
            Invitation presse
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '10px'
          }}>
            {vars.artistName} en concert
          </div>
          <div style={{
            fontSize: '16px',
            opacity: '0.9'
          }}>
            Showcase "{vars.projectName}"
          </div>
        </div>

        {/* Message d'invitation */}
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
            J'ai le plaisir de vous inviter au showcase de <strong>{vars.artistName}</strong>
            qui présentera son nouveau {vars.projectType.toLowerCase()} "<strong>{vars.projectName}</strong>"
            en live.
          </p>

          <p style={{ marginBottom: '20px' }}>
            {vars.description}
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cet événement sera l'occasion de découvrir les nouveaux titres en exclusivité
            et de rencontrer l'artiste dans un cadre intimiste.
          </p>
        </div>

        {/* Informations pratiques */}
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
            marginBottom: '20px'
          }}>
            Informations pratiques
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#000000',
                marginBottom: '5px'
              }}>
                📍 Lieu
              </div>
              <div style={{ fontSize: '14px', color: '#666666' }}>
                {vars.venue}<br />
                {vars.venueAddress}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#000000',
                marginBottom: '5px'
              }}>
                🕐 Horaires
              </div>
              <div style={{ fontSize: '14px', color: '#666666' }}>
                {vars.eventDate}<br />
                Accueil presse : {vars.eventTime}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            padding: '15px',
            borderRadius: '6px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '8px'
            }}>
              📝 Programme
            </div>
            <div style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6' }}>
              • {vars.eventTime} - Accueil presse & cocktail<br />
              • {vars.eventTime.replace(':', ':30')} - Showcase exclusif<br />
              • 21h30 - Rencontre avec l'artiste<br />
              • 22h00 - Clôture de l'événement
            </div>
          </div>
        </div>

        {/* Accréditation */}
        <div style={{
          backgroundColor: '#f59e0b',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
            🎫 Accréditation presse
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Confirmez votre présence pour recevoir votre invitation
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            color: '#f59e0b',
            padding: '12px 20px',
            borderRadius: '6px',
            display: 'inline-block',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Répondre à cette invitation
          </div>
        </div>

        {/* Bonus */}
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
            🎁 Bonus presse
          </h3>
          <ul style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '8px' }}>Interview exclusive possible avec {vars.artistName}</li>
            <li style={{ marginBottom: '8px' }}>Photos/vidéos autorisées pendant le showcase</li>
            <li style={{ marginBottom: '8px' }}>EPK complet remis sur clé USB</li>
            <li style={{ marginBottom: '8px' }}>Rencontre privilégiée avec l'équipe artistique</li>
          </ul>
        </div>

        {/* Plan d'accès */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '10px'
          }}>
            🗺️ Accès & parking
          </h4>
          <div style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6' }}>
            Métro : [Station la plus proche]<br />
            Bus : [Lignes de bus]<br />
            Parking gratuit disponible<br />
            Accès PMR : Oui
          </div>
        </div>

        {/* Message de fin */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Merci de confirmer votre présence avant le <strong>{vars.deadline}</strong>
            afin que nous puissions organiser au mieux votre accueil.
          </p>

          <p style={{ marginBottom: '20px' }}>
            N'hésitez pas à me contacter pour toute question ou demande spécifique.
          </p>

          <p style={{ marginBottom: '20px' }}>
            J'espère avoir le plaisir de vous y retrouver.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cordialement,
          </p>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// 8. Template Relance presse
export const FollowUpTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      <div style={{ padding: '40px 30px' }}>
        {/* En-tête relance */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}>
            Suivi de notre échange
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#000000'
          }}>
            {vars.artistName} • "{vars.projectName}"
          </div>
        </div>

        {/* Message de relance courtois */}
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
            J'espère que vous allez bien. Je me permets de revenir vers vous concernant
            le {vars.projectType.toLowerCase()} de <strong>{vars.artistName}</strong>,
            "<strong>{vars.projectName}</strong>", que je vous avais présenté récemment.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Je comprends parfaitement que vous receviez de nombreuses propositions
            et que vos plannings soient chargés.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Depuis notre dernier échange, voici les nouveaux éléments qui pourraient
            vous intéresser :
          </p>
        </div>

        {/* Nouveautés depuis le dernier envoi */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#0ea5e9',
            marginBottom: '15px'
          }}>
            🆕 Nouveautés depuis notre dernier échange
          </h3>
          <ul style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '8px' }}>Nouveau clip vidéo disponible</li>
            <li style={{ marginBottom: '8px' }}>Interview exclusive dans [Média]</li>
            <li style={{ marginBottom: '8px' }}>Dates de tournée annoncées</li>
            <li style={{ marginBottom: '8px' }}>Collaboration surprise dévoilée</li>
          </ul>
        </div>

        {/* Statistiques récentes */}
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
            Derniers chiffres
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            fontSize: '14px',
            color: '#666666'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0ED894' }}>2.5M</div>
              <div>Écoutes Spotify</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0ED894' }}>856K</div>
              <div>Vues YouTube</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0ED894' }}>125K</div>
              <div>Followers IG</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0ED894' }}>45</div>
              <div>Médias partenaires</div>
            </div>
          </div>
        </div>

        {/* Propositions alternatives */}
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
            💡 Propositions alternatives
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6'
          }}>
            <p style={{ marginBottom: '15px' }}>
              Si le format initial ne convenait pas, nous pouvons adapter notre proposition :
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>Interview courte (10-15 minutes)</li>
              <li style={{ marginBottom: '8px' }}>Questions écrites par email</li>
              <li style={{ marginBottom: '8px' }}>Focus sur un angle spécifique</li>
              <li style={{ marginBottom: '8px' }}>Reportage concert/studio</li>
            </ul>
          </div>
        </div>

        {/* Rappel EPK */}
        <div style={{
          backgroundColor: '#6b7280',
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
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
            Rappel : EPK toujours disponible
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            marginBottom: '15px',
            opacity: '0.9'
          }}>
            Tous les éléments de presse, mis à jour régulièrement
          </div>
          <a href={vars.epkLink} style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: '#6b7280',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            Accéder à l'EPK
          </a>
        </div>

        {/* Message de fin courtois */}
        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#333333'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Bien entendu, si ce projet ne correspond pas à votre ligne éditoriale
            ou à vos contraintes actuelles, je le comprends parfaitement.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Dans tous les cas, n'hésitez pas à me tenir informé(e) de vos retours,
            même négatifs, cela m'aide beaucoup pour mes futures propositions.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Je vous souhaite une excellente continuation.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Cordialement,
          </p>
        </div>
      </div>
    </TemplateWrapper>
  );
};

// Export des templates de la partie 2
export const emailTemplatesPart2 = {
  playlist: PlaylistTemplate,
  live: LiveTemplate,
  'follow-up': FollowUpTemplate
};

export default emailTemplatesPart2;