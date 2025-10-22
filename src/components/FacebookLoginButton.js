// src/components/FacebookLoginButton.js
import React from "react";
import FacebookLogin from "react-facebook-login";
import axios from "axios";

const FacebookLoginButton = ({ onSuccess, onError }) => {
  const handleFacebookResponse = async (response) => {
    if (response.status === "unknown") {
      onError("Échec de la connexion Facebook.");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/facebook`, {
        accessToken: response.accessToken,
        userID: response.userID,
        name: response.name,
        email: response.email,
      });

      onSuccess(`Connexion réussie ! Bienvenue, ${res.data.user.name}`);
    } catch (err) {
      console.error("Erreur Facebook Auth :", err);
      onError("Erreur lors de la connexion Facebook.");
    }
  };

  return (
    <FacebookLogin
      appId={import.meta.env.VITE_FACEBOOK_APP_ID}
      autoLoad={false}
      fields="name,email"
      callback={handleFacebookResponse}
      cssClass="facebook-button"
      icon="fa-facebook"
      textButton=" Se connecter avec Facebook"
    />
  );
};

export default FacebookLoginButton;
