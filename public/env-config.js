/**
 * Configuration d'environnement Izy-scoly
 * ========================================
 * Ce fichier permet de configurer l'application pour un backend externe.
 * 
 * INSTRUCTIONS POUR MIGRATION BACKEND EXTERNE:
 * 1. Créez un projet Supabase sur https://supabase.com
 * 2. Copiez les valeurs de votre projet ici
 * 3. Exécutez les migrations SQL depuis le dossier supabase/migrations/
 * 4. Configurez les secrets dans Edge Functions → Settings
 * 
 * Pour un déploiement sur cPanel/OVH/autre:
 * 1. Remplacez les valeurs ci-dessous par celles de votre projet Supabase
 * 2. Téléversez le dossier 'dist/' complet sur votre hébergeur
 * 3. Assurez-vous que le .htaccess est actif
 */

window.__IZY_SCOLY_CONFIG__ = {
  // Remplacez par l'URL de votre projet Supabase
  SUPABASE_URL: "https://zvzrnqckqcqwysplhpfe.supabase.co",
  
  // Remplacez par la clé publique (anon) de votre projet
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2enJucWNrcWNxd3lzcGxocGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTgyNjcsImV4cCI6MjA4NTI5NDI2N30.eIPxrxbQkB0-0_OH8KLfI_Hf5by1AuRQBx_jetjE0iY",
  
  // ID du projet (pour Edge Functions)
  PROJECT_ID: "zvzrnqckqcqwysplhpfe",
  
  // Domaine principal de l'application
  APP_DOMAIN: "https://izy-scoly.ci",
  
  // Version de l'application
  APP_VERSION: "2.0.0"
};

// Note: Ce fichier est chargé avant l'application principale.
// Les valeurs peuvent être lues depuis n'importe quel composant via:
//   window.__IZY_SCOLY_CONFIG__.SUPABASE_URL
