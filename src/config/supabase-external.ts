/**
 * Configuration Supabase Externe pour Izy-Scoly
 * ==============================================
 * 
 * Ce fichier permet de configurer facilement la connexion à un projet Supabase externe.
 * 
 * INSTRUCTIONS POUR MIGRER VERS SUPABASE EXTERNE:
 * 
 * 1. Créez un compte Supabase gratuit sur https://supabase.com
 * 
 * 2. Créez un nouveau projet:
 *    - Cliquez sur "New Project"
 *    - Choisissez un nom (ex: "izy-scoly-prod")
 *    - Définissez un mot de passe fort pour la base de données
 *    - Choisissez une région proche de vos utilisateurs (ex: Europe West pour Côte d'Ivoire)
 * 
 * 3. Récupérez vos credentials:
 *    - Allez dans Settings > API
 *    - Copiez "Project URL" → c'est votre SUPABASE_URL
 *    - Copiez "anon public" key → c'est votre SUPABASE_ANON_KEY
 *    - Le Project ID est visible dans l'URL: https://supabase.com/dashboard/project/[PROJECT_ID]
 * 
 * 4. Exportez et importez le schéma de base de données:
 *    - Dans votre projet Supabase actuel, allez dans SQL Editor
 *    - Exécutez: SELECT * FROM pg_dump...
 *    - Ou utilisez les migrations dans le dossier supabase/migrations/
 * 
 * 5. Configurez les secrets Edge Functions:
 *    - Allez dans Edge Functions > Settings
 *    - Ajoutez: RESEND_API_KEY, KKIAPAY_PUBLIC_KEY, KKIAPAY_PRIVATE_KEY, etc.
 * 
 * 6. Mettez à jour ce fichier avec vos nouvelles valeurs
 * 
 * 7. Déployez les Edge Functions:
 *    - Installez Supabase CLI: npm install -g supabase
 *    - supabase login
 *    - supabase link --project-ref [PROJECT_ID]
 *    - supabase functions deploy
 */

export interface ExternalSupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

/**
 * Configuration par défaut - Supabase Cloud actuel
 * Remplacez ces valeurs par celles de votre projet Supabase externe
 */
export const EXTERNAL_SUPABASE_CONFIG: ExternalSupabaseConfig = {
  // URL de votre projet Supabase
  // Format: https://[PROJECT_ID].supabase.co
  url: import.meta.env.VITE_SUPABASE_URL || "https://zvzrnqckqcqwysplhpfe.supabase.co",
  
  // Clé publique (anon key) - peut être exposée côté client
  // Trouvée dans: Settings > API > anon public
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2enJucWNrcWNxd3lzcGxocGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTgyNjcsImV4cCI6MjA4NTI5NDI2N30.eIPxrxbQkB0-0_OH8KLfI_Hf5by1AuRQBx_jetjE0iY",
  
  // ID du projet Supabase
  // Visible dans l'URL du dashboard: supabase.com/dashboard/project/[PROJECT_ID]
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "zvzrnqckqcqwysplhpfe",
};

/**
 * Fonction pour obtenir l'URL des Edge Functions
 */
export const getEdgeFunctionUrl = (functionName: string): string => {
  return `${EXTERNAL_SUPABASE_CONFIG.url}/functions/v1/${functionName}`;
};

/**
 * Vérifie si la configuration utilise un Supabase externe
 */
export const isExternalSupabase = (): boolean => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  return !!envUrl && !envUrl.includes('zvzrnqckqcqwysplhpfe');
};

/**
 * Guide de migration complet
 */
export const MIGRATION_GUIDE = `
=== GUIDE DE MIGRATION SUPABASE EXTERNE ===

ÉTAPE 1: CRÉER UN PROJET SUPABASE
---------------------------------
1. Allez sur https://supabase.com et créez un compte
2. Cliquez sur "New Project"
3. Choisissez:
   - Organization: Votre organisation
   - Name: izy-scoly-production
   - Database Password: [MOT DE PASSE FORT]
   - Region: EU West (Frankfurt) - plus proche de l'Afrique
4. Attendez que le projet soit créé (~2 minutes)

ÉTAPE 2: RÉCUPÉRER LES CREDENTIALS
----------------------------------
1. Allez dans Settings > API
2. Notez:
   - Project URL: https://[votre-id].supabase.co
   - anon public key: eyJhbGc...
   - service_role key: eyJhbGc... (NE JAMAIS exposer côté client!)

ÉTAPE 3: CONFIGURER LA BASE DE DONNÉES
--------------------------------------
1. Allez dans SQL Editor
2. Exécutez les migrations du dossier supabase/migrations/ dans l'ordre chronologique
3. OU importez un backup de votre base actuelle

ÉTAPE 4: CONFIGURER LE STORAGE
------------------------------
1. Allez dans Storage
2. Créez les buckets:
   - product-images (public)
   - article-images (public)
   - article-media (public)
   - advertisement-media (public)

ÉTAPE 5: CONFIGURER LES SECRETS
-------------------------------
1. Allez dans Edge Functions > Settings
2. Ajoutez les secrets:
   - RESEND_API_KEY
   - KKIAPAY_PUBLIC_KEY
   - KKIAPAY_PRIVATE_KEY
   - KKIAPAY_SECRET
   - VAPID_PUBLIC_KEY
   - VAPID_PRIVATE_KEY
   - BOOTSTRAP_ADMIN_TOKEN

ÉTAPE 6: DÉPLOYER LES EDGE FUNCTIONS
------------------------------------
1. Installez Supabase CLI:
   npm install -g supabase

2. Connectez-vous:
   supabase login

3. Liez votre projet:
   supabase link --project-ref [VOTRE_PROJECT_ID]

4. Déployez:
   supabase functions deploy

ÉTAPE 7: METTRE À JOUR LE FRONTEND
----------------------------------
1. Modifiez public/env-config.js avec vos nouvelles valeurs
2. OU définissez les variables d'environnement:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
   - VITE_SUPABASE_PROJECT_ID

3. Rebuild l'application:
   npm run build

4. Téléversez le dossier dist/ sur votre hébergeur

ÉTAPE 8: TESTER
---------------
1. Testez l'authentification
2. Testez les opérations CRUD
3. Testez les Edge Functions
4. Vérifiez les logs dans Supabase Dashboard

=== FIN DU GUIDE ===
`;
