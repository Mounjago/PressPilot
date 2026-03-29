# 📧 Templates Professionnels PressPilot

## Vue d'ensemble

Les templates professionnels PressPilot offrent une solution clé en main pour créer des emails de presse musicale de qualité professionnelle. Conçus spécialement pour les attachés de presse, ces templates garantissent une image cohérente et impactante pour toutes vos campagnes.

## 🎯 Types de Templates Disponibles

### 1. **Communiqué de presse** (`communique`)
- Format officiel pour annoncer une sortie, actualité ou événement
- Structure classique avec en-tête, accroche et informations complètes
- Idéal pour : Sorties d'albums, annonces officielles, nominations

### 2. **Teaser / Annonce** (`teaser`)
- Format court et percutant pour créer l'attente
- Design moderne avec mise en avant visuelle
- Idéal pour : Premiers extraits, annonces mystérieuses, avant-premières

### 3. **Demande d'interview** (`interview`)
- Template personnalisé pour solliciter les journalistes
- Approche courtoise avec angles proposés
- Idéal pour : Interviews radio/TV, portraits, rencontres

### 4. **Demande de chronique** (`review`)
- Format spécialisé pour les demandes de review
- Informations techniques et liens d'écoute
- Idéal pour : Critiques d'albums, chroniques, tests

### 5. **Première exclusive** (`premiere`)
- Template premium pour les exclusivités médias
- Badge exclusivité et délais spécifiés
- Idéal pour : Premiers singles, scoops, contenus exclusifs

### 6. **Demande playlist** (`playlist`)
- Spécialisé pour les curateurs et programmateurs
- Informations techniques (BPM, genre, mood)
- Idéal pour : Playlists Spotify, radios, curateurs

### 7. **Invitation concert/showcase** (`live`)
- Template événementiel avec informations pratiques
- Plan d'accès et modalités d'accréditation
- Idéal pour : Concerts, showcases, festivals

### 8. **Relance presse** (`follow-up`)
- Template de suivi courtois et professionnel
- Rappel délicat avec nouvelles informations
- Idéal pour : Suivis de campagnes, relances polies

## 🛠️ Composants Techniques

### TemplateSelector
**Fichier :** `/src/components/TemplateSelector.jsx`

Interface de sélection des templates avec :
- Vue d'ensemble des 8 templates
- Recommandations basées sur le type de campagne
- Aperçu des fonctionnalités de chaque template

**Props :**
```jsx
<TemplateSelector
  onTemplateSelect={handleTemplateSelect}
  campaignType="communique"
  artistName="Nom de l'artiste"
  projectName="Nom du projet"
/>
```

### VariableManager
**Fichier :** `/src/components/VariableManager.jsx`

Gestionnaire de variables dynamiques avec :
- Variables prédéfinies par type de campagne
- Variables personnalisées
- Validation en temps réel

**Props :**
```jsx
<VariableManager
  campaignType="communique"
  onVariablesChange={handleVariablesChange}
  initialVariables={{
    artistName: "Luna Rosa",
    projectName: "Midnight Dreams"
  }}
/>
```

### TemplatePreview
**Fichier :** `/src/components/TemplatePreview.jsx`

Prévisualisation en temps réel avec :
- Vues responsive (desktop, tablet, mobile)
- Export HTML optimisé pour les clients email
- Copie du code source

**Props :**
```jsx
<TemplatePreview
  templateType="communique"
  variables={templateVariables}
  showPreview={true}
  onExportHTML={handleExportHTML}
/>
```

### Templates Email
**Fichiers :**
- `/src/components/templates/EmailTemplates.jsx` (Templates 1-5)
- `/src/components/templates/EmailTemplatesPart2.jsx` (Templates 6-8)

Composants React rendant les emails avec :
- Styles inline pour compatibilité email
- Variables dynamiques
- Design responsive

## 🎨 Charte Graphique

### Couleurs PressPilot
- **Vert principal :** `#0ED894`
- **Noir :** `#000000`
- **Blanc :** `#FFFFFF`
- **Gris texte :** `#333333`
- **Gris clair :** `#666666`

### Typographie
- **Police principale :** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Titres :** Font-weight 700, tailles variables
- **Corps de texte :** Font-weight 400, line-height 1.6

## 📱 Responsive Design

Tous les templates sont optimisés pour :
- **Desktop :** Largeur maximale 600px
- **Tablette :** Adaptation fluide
- **Mobile :** Design mobile-first avec media queries

## 🔧 Variables Dynamiques

### Variables Communes (tous templates)
```javascript
{
  artistName: "Nom de l'artiste",
  projectName: "Titre du projet",
  projectType: "Album|EP|Single|Mixtape",
  releaseDate: "01/01/2024",
  label: "Nom du label",
  genre: "Genre musical",
  description: "Description du projet",
  contactName: "Nom du contact presse",
  contactEmail: "email@contact.com",
  contactPhone: "+33 1 23 45 67 89",
  epkLink: "https://epk-link.com",
  websiteUrl: "https://artiste.com",
  spotifyUrl: "https://spotify.com/artist",
  youtubeUrl: "https://youtube.com/artiste",
  instagramUrl: "https://instagram.com/artiste"
}
```

### Variables Spécifiques

#### Template Première (`premiere`)
```javascript
{
  exclusivityPeriod: "48h",
  deadline: "01/01/2024"
}
```

#### Template Concert (`live`)
```javascript
{
  venue: "Nom de la salle",
  venueAddress: "Adresse complète",
  eventDate: "01/01/2024",
  eventTime: "20h00"
}
```

#### Template Playlist (`playlist`)
```javascript
{
  bpm: "120",
  mood: "Énergique",
  playlistName: "Nom de la playlist cible"
}
```

## 🚀 Utilisation dans Campaigns.jsx

### Intégration
```jsx
import TemplateSelector from "../components/TemplateSelector";
import VariableManager from "../components/VariableManager";
import TemplatePreview from "../components/TemplatePreview";
```

### État de gestion
```jsx
const [newCampaign, setNewCampaign] = useState({
  // ... autres propriétés
  useTemplate: false,
  selectedTemplate: null,
  templateVariables: {}
});
```

### Fonctions de gestion
```jsx
const handleTemplateSelect = (template) => {
  setNewCampaign(prev => ({
    ...prev,
    useTemplate: true,
    selectedTemplate: template,
    type: template.id
  }));
};

const handleTemplateVariablesChange = (variables) => {
  setNewCampaign(prev => ({
    ...prev,
    templateVariables: variables
  }));
};
```

## 📤 Export HTML

### Fonctionnalités d'export
- **HTML complet** avec DOCTYPE et meta tags
- **Styles inline** pour compatibilité email maximale
- **Responsive design** avec media queries
- **Nommage automatique** basé sur l'artiste et le projet

### Utilisation
```jsx
const handleExportHTML = (htmlContent) => {
  // htmlContent contient le HTML complet
  // Peut être sauvegardé ou envoyé à l'API
  console.log('HTML exporté:', htmlContent);
};
```

## 🎨 Styles CSS

### Fichier principal
**Fichier :** `/src/styles/Templates.css`

Contient tous les styles pour :
- Sélecteur de templates
- Gestionnaire de variables
- Prévisualisation
- Responsive design
- Animations

### Classes principales
- `.template-mode-selector` : Sélecteur de mode création
- `.template-card` : Cartes de templates
- `.variable-manager` : Interface de gestion des variables
- `.template-preview` : Conteneur de prévisualisation

## 🔧 Personnalisation

### Ajouter un nouveau template

1. **Créer le composant template :**
```jsx
export const MonNouveauTemplate = ({ variables = {} }) => {
  const vars = { ...defaultVariables, ...variables };

  return (
    <TemplateWrapper variables={variables}>
      {/* Contenu du template */}
    </TemplateWrapper>
  );
};
```

2. **Ajouter aux exports :**
```jsx
export const emailTemplates = {
  // ... templates existants
  monNouveau: MonNouveauTemplate
};
```

3. **Mettre à jour TemplateSelector :**
```jsx
const templates = {
  // ... templates existants
  monNouveau: {
    id: 'monNouveau',
    name: 'Mon Nouveau Template',
    icon: IconComponent,
    description: 'Description du template',
    color: 'bg-blue-50 border-blue-200'
  }
};
```

### Ajouter des variables spécifiques

Dans `VariableManager.jsx`, section `predefinedVariables.specific` :
```jsx
monNouveau: {
  maVariable: {
    label: 'Ma Variable',
    type: 'text',
    required: true
  }
}
```

## 🧪 Démonstration

### TemplateDemo
**Fichier :** `/src/components/TemplateDemo.jsx`

Composant de démonstration complet avec :
- Interface pas-à-pas
- Données de démonstration
- Tous les templates en action

### Utilisation
```jsx
import TemplateDemo from '../components/TemplateDemo';

// Dans votre composant
<TemplateDemo />
```

## 🏆 Bonnes Pratiques

### Performance
- Les templates utilisent des styles inline pour l'email
- Les images sont optimisées et responsive
- Le code est minifié lors de l'export

### Accessibilité
- Tous les templates respectent les standards d'accessibilité
- Contraste couleurs conforme WCAG
- Navigation clavier supportée

### SEO Email
- Structure sémantique HTML
- Alt tags sur toutes les images
- Liens avec titres descriptifs

## 🆘 Dépannage

### Problèmes courants

1. **Template ne s'affiche pas :**
   - Vérifier l'import des composants
   - Vérifier que le type de template existe

2. **Variables non prises en compte :**
   - Vérifier la structure de l'objet variables
   - Vérifier les clés des variables

3. **Styles non appliqués :**
   - Vérifier l'import du CSS Templates.css
   - Vérifier la compatibilité du client email

### Support
Pour toute question ou problème, consulter :
- La documentation technique dans le code
- Les exemples dans TemplateDemo.jsx
- Les commentaires dans chaque composant

---

**Version :** 1.0.1
**Derniere mise a jour :** Mars 2026
**Auteur :** PressPilot Team