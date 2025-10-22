import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Remplacez ces valeurs par celles de votre configuration Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // ... autres propriétés nécessaires
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        // Vous pouvez récupérer le token, les infos de l'utilisateur, etc.
        console.log("Utilisateur connecté :", result.user);
        // Par exemple, stockez le token dans le localStorage
        localStorage.setItem("authToken", result.user.accessToken);
      })
      .catch((error) => {
        console.error("Erreur d'authentification :", error);
      });
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="bg-[#0ED894] text-white px-6 py-3 rounded-full text-xl font-bold hover:opacity-90"
    >
      Accéder à PressPilot
    </button>
  );
};

export default GoogleSignInButton;
