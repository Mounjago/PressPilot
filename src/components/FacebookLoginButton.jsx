import React, { useState } from "react";
import FacebookLogin from "react-facebook-login";
import axios from "axios";
import config from "../config";

const FacebookLoginButton = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFacebookResponse = async (response) => {
    // Si l'utilisateur annule la connexion
    if (response.status === "unknown") {
      const message = "Connexion Facebook annulée.";
      setErrorMessage(message);
      if (onError) onError(message);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Log pour débogage
      console.log("Réponse Facebook reçue:", { 
        accessToken: response.accessToken ? "présent" : "absent", 
        userID: response.userID 
      });
      
      // Construire l'URL complète
      // Tester les deux chemins possibles pour résoudre le problème 404
      const authUrl = `${config.apiUrl}/auth/facebook`; 
      console.log("Envoi de la requête à:", authUrl);
      
      try {
        const res = await axios.post(authUrl, {
          accessToken: response.accessToken,
          userID: response.userID,
          name: response.name,
          email: response.email,
        });

        console.log("Réponse du backend:", res.data);
        
        if (onSuccess) {
          onSuccess(`Connexion réussie ! Bienvenue, ${res.data.user.name}`);
        }
      } catch (firstError) {
        // Si la première URL échoue, essayer avec le préfixe /api
        console.log("Premier chemin échoué, essai avec /auth/facebook");
        const alternativeUrl = `${config.apiUrl}/auth/facebook`;
        
        const res = await axios.post(alternativeUrl, {
          accessToken: response.accessToken,
          userID: response.userID,
          name: response.name,
          email: response.email,
        });
        
        console.log("Réponse du backend (chemin alternatif):", res.data);
        
        if (onSuccess) {
          onSuccess(`Connexion réussie ! Bienvenue, ${res.data.user.name}`);
        }
      }
    } catch (err) {
      console.error("Erreur Facebook Auth détaillée:", err);
      
      let message = "Erreur lors de la connexion Facebook.";
      if (err.response) {
        message += ` (${err.response.status}: ${err.response.data?.message || err.response.statusText})`;
      } else if (err.request) {
        message += " (Aucune réponse du serveur)";
      } else {
        message += ` (${err.message})`;
      }
      
      setErrorMessage(message);
      
      if (onError) {
        onError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <FacebookLogin
        appId={config.facebookAppId}
        autoLoad={false}
        fields="name,email"
        callback={handleFacebookResponse}
        cssClass={`facebook-button ${isLoading ? 'disabled' : ''}`}
        icon="fa-facebook"
        textButton={isLoading ? "Connexion en cours..." : " Se connecter avec Facebook"}
        disableMobileRedirect={true}
      />
      
      {errorMessage && (
        <div className="text-red-500 mt-2 text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default FacebookLoginButton;
