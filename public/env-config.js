/**
 * Configuration Supabase Externe - Izy-scoly
 * ===========================================
 * 
 * IMPORTANT: Ce fichier permet de connecter l'application à votre projet Supabase externe
 * APRÈS le build, sans avoir à recompiler l'application.
 * 
 * INSTRUCTIONS POUR SUPABASE EXTERNE:
 * 
 * 1. Créez un compte sur https://supabase.com (gratuit)
 * 
 * 2. Créez un nouveau projet et récupérez vos credentials:
 *    - Settings > API > Project URL
 *    - Settings > API > anon public key
 *    - L'ID du projet est dans l'URL: supabase.com/dashboard/project/[ID]
 * 
 * 3. Remplacez les valeurs ci-dessous par vos propres valeurs
 * 
 * 4. Exécutez les migrations SQL (dossier supabase/migrations/) dans votre projet
 * 
 * 5. Configurez les secrets Edge Functions dans Supabase Dashboard
 * 
 * 6. Déployez les Edge Functions avec: supabase functions deploy
 */

window.__IZY_SCOLY_CONFIG__ = {
  // ===== REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET SUPABASE =====
  
  // URL de votre projet Supabase
  // Exemple: https://abcdefghijklmnop.supabase.co
  SUPABASE_URL: "https://zvzrnqckqcqwysplhpfe.supabase.co",
  
  // Clé publique (anon key) de votre projet
  // Trouvée dans: Settings > API > anon public
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2enJucWNrcWNxd3lzcGxocGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTgyNjcsImV4cCI6MjA4NTI5NDI2N30.eIPxrxbQkB0-0_OH8KLfI_Hf5by1AuRQBx_jetjE0iY",
  
  // ID du projet (visible dans l'URL du dashboard Supabase)
  PROJECT_ID: "zvzrnqckqcqwysplhpfe",
  
  // ===== CONFIGURATION DE L'APPLICATION =====
  
  // Domaine principal de votre application
  APP_DOMAIN: "https://izy-scoly.ci",
  
  // Version de l'application
  APP_VERSION: "2.1.0",
  
  // Nom de l'application (pour SEO et affichage)
  APP_NAME: "Izy-scoly",
  
  // Description de l'application
  APP_DESCRIPTION: "Plateforme éducative et e-commerce pour la Côte d'Ivoire"
};

/**
 * GUIDE RAPIDE - MIGRATION SUPABASE EXTERNE
 * ==========================================
 * 
 * ÉTAPE 1: Créer un projet Supabase
 * - Allez sur https://supabase.com
 * - Créez un nouveau projet (région EU West recommandée)
 * 
 * ÉTAPE 2: Récupérer vos credentials
 * - Settings > API
 * - Copiez Project URL et anon public key
 * 
 * ÉTAPE 3: Importer la base de données
 * - Ouvrez SQL Editor dans Supabase
 * - Exécutez chaque fichier du dossier supabase/migrations/
 * 
 * ÉTAPE 4: Créer les buckets Storage
 * - Storage > New Bucket
 * - Créez: product-images, article-images, article-media, advertisement-media
 * - Activez "Public bucket" pour chacun
 * 
 * ÉTAPE 5: Configurer les secrets
 * - Edge Functions > Settings
 * - Ajoutez: RESEND_API_KEY, KKIAPAY_PUBLIC_KEY, KKIAPAY_PRIVATE_KEY, etc.
 * 
 * ÉTAPE 6: Déployer les Edge Functions
 * - Installez: npm install -g supabase
 * - supabase login
 * - supabase link --project-ref [VOTRE_PROJECT_ID]
 * - supabase functions deploy
 * 
 * ÉTAPE 7: Mettre à jour ce fichier
 * - Remplacez SUPABASE_URL, SUPABASE_ANON_KEY et PROJECT_ID
 * 
 * ÉTAPE 8: Téléverser sur votre hébergeur
 * - Téléversez le dossier dist/ complet sur cPanel/FTP
 */
