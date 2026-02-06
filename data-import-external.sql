-- ============================================================================
-- SCRIPT D'IMPORTATION DES DONNÉES - IZY-SCOLY
-- ============================================================================
-- À exécuter APRÈS avoir exécuté database-migration-complete.sql
-- IMPORTANT : Copiez le CONTENU de ce fichier dans le SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/duxbzpsezdhvhprwjwmk/sql
-- ============================================================================

-- ============================================================================
-- PARTIE 1: CATÉGORIES
-- ============================================================================
INSERT INTO public.categories (id, slug, name_fr, name_en, name_de, name_es, parent_id, created_at) VALUES
('81b59ff7-67ca-419f-a7de-f7ad31bb1cf0', 'scoly-primaire', 'Scoly Primaire', 'Scoly Primary', 'Scoly Grundschule', 'Scoly Primaria', NULL, '2025-12-21 18:25:01.226726+00'),
('059fad77-ff9c-4df2-a020-7cdbb417b792', 'scoly-secondaire', 'Scoly Secondaire', 'Scoly Secondary', 'Scoly Sekundarschule', 'Scoly Secundaria', NULL, '2025-12-21 18:25:01.226726+00'),
('d285aaeb-1fcb-4eb3-9d82-8a5cbb8e0d59', 'scoly-universite', 'Scoly Université', 'Scoly University', 'Scoly Universität', 'Scoly Universidad', NULL, '2025-12-21 18:25:01.226726+00'),
('9629976d-eece-4b4c-8542-a58662660600', 'scoly-bureautique', 'Scoly Bureautique', 'Scoly Office', 'Scoly Büro', 'Scoly Oficina', NULL, '2025-12-21 18:25:01.226726+00'),
('b9eee6fa-07c0-4e22-9e66-1ecac6998806', 'scoly-librairie', 'Scoly Librairie', 'Scoly Bookstore', 'Scoly Buchhandlung', 'Scoly Librería', NULL, '2025-12-21 18:25:01.226726+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTIE 2: PUBLICITÉS
-- ============================================================================
INSERT INTO public.advertisements (id, title, description, media_type, media_url, link_url, link_text, priority, is_active, starts_at, ends_at, created_at) VALUES
('6211fd4a-0ef8-435d-b0bd-c6491dc8bf6f', 'Rentrée Scolaire 2025-2026', 'Préparez la rentrée avec Izy-Scoly ! Profitez de -20% sur toutes les fournitures scolaires. Livraison gratuite à partir de 15 500 FCFA.', 'image', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', '/shop', 'Découvrir les offres', 1, true, '2026-01-13 00:00:00+00', '2026-02-28 00:00:00+00', '2026-01-13 03:48:52.314333+00'),
('fac92c13-5bf3-4485-a693-ce74be18c004', 'Éditions Éburnie - Partenaire Officiel', 'Découvrez la collection complète des manuels scolaires agréés par le Ministère de l''Éducation. Livres de qualité pour tous les niveaux, du CP à la Terminale. Livraison gratuite à partir de 10 000 FCFA !', 'image', 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/advertisement-media/images/1769692404990-osbbr4.jpg', '/shop?brand=editions-eburnie', 'Voir la collection', 1, true, '2026-01-14 00:00:00+00', '2026-02-13 00:00:00+00', '2026-01-14 06:09:09.6869+00'),
('d689778e-a712-4cdf-aaa0-07970c0bab4a', 'Bureau Plus - Fournitures Scolaires moins chers', 'Équipez vos enfants avec les meilleures fournitures de bureau ! Cahiers, stylos, calculatrices, sacs à dos et plus encore. Qualité garantie et prix imbattables pour la rentrée 2025.', 'image', 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/advertisement-media/images/1769692436178-2cnnfh.jpg', '/shop?category=fournitures-scolaires', 'Je prépare la rentrée !', 1, true, '2026-01-14 00:00:00+00', '2026-02-28 00:00:00+00', '2026-01-14 06:09:09.6869+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTIE 3: PROFILS UTILISATEURS
-- ============================================================================
-- Note: Les utilisateurs devront se réinscrire sur le nouveau backend.
-- Ces profils sont créés avec les mêmes IDs pour garder la cohérence des données.
-- Les mots de passe NE SONT PAS transférables (hash différent).

INSERT INTO public.profiles (id, first_name, last_name, email, phone, preferred_language, created_at, updated_at) VALUES
('a19a82f4-b345-422b-9d7e-fada9c3b9522', 'Inocent', 'KOFFI', NULL, '0759566087', 'fr', '2025-12-26 04:21:13.406136+00', '2025-12-26 04:21:13.406136+00'),
('66c4a146-40b0-41cb-bed4-128d5079e462', 'Naan ', 'KOFF PROD ', 'naankoffprod@gmail.com', '+2250564551717', 'fr', '2026-01-25 02:08:11.724198+00', '2026-01-30 01:45:38.082399+00'),
('bbf0c9e8-b9b8-4ac4-a12c-02d42f2867ee', 'Inocent ', 'KOFFI ', 'innocentkoffi1@gmail.com', '0564551717', 'fr', '2025-12-25 13:50:42.961699+00', '2026-01-30 01:48:13.544776+00'),
('24cc1ed2-040f-4ad7-8413-a416518fb684', 'Inocent ', 'KOFFI ', 'admin@scoly.ci', '+225 07 59 56 60 87', 'fr', '2026-01-02 21:16:23.436945+00', '2026-01-30 02:12:11.704246+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTIE 4: RÔLES UTILISATEURS
-- ============================================================================
INSERT INTO public.user_roles (id, user_id, role) VALUES
('0ad9eddb-992e-4ae3-ab1a-3a4776364fc4', '24cc1ed2-040f-4ad7-8413-a416518fb684', 'admin'),
('3df701fd-2a92-49c7-a914-b52f48d19660', 'a19a82f4-b345-422b-9d7e-fada9c3b9522', 'delivery'),
('9711f49a-22d8-4edf-aec7-3162e8689dbf', 'a19a82f4-b345-422b-9d7e-fada9c3b9522', 'moderator'),
('32b83658-d3a8-4aa3-8cc0-d67521c40978', 'a19a82f4-b345-422b-9d7e-fada9c3b9522', 'vendor'),
('6830730d-659d-45d5-8873-607d65251817', '66c4a146-40b0-41cb-bed4-128d5079e462', 'delivery')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTIE 5: PRODUITS (EXEMPLE - Les 4 principaux)
-- ============================================================================
INSERT INTO public.products (id, name_fr, name_en, name_de, name_es, description_fr, description_en, description_de, description_es, price, original_price, discount_percent, stock, image_url, category_id, is_active, is_featured, free_shipping, brand, model, color, material, product_type, is_office_supply, created_at, updated_at) VALUES
('1de2eb67-e33c-48a4-aed7-c9cfe2f6cb12', 'Imprimante Canon', 'Canon Printer', 'Canon Drucker', 'Impresora Canon', 
 'Choisissez la qualité et la rapidité d''impression. Avec une imprimante qui consomme moins d''électricité et d''ancre.', 
 'Choisissez la qualité et la rapidité d''impression. Avec une imprimante qui consomme moins d''électricité et d''ancre.', 
 'Choisissez la qualité et la rapidité d''impression. Avec une imprimante qui consomme moins d''électricité et d''ancre.', 
 'Choisissez la qualité et la rapidité d''impression. Avec une imprimante qui consomme moins d''électricité et d''ancre.', 
 52800.00, 6700.00, 21, 50, 
 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/product-images/products/1767992842431.jpg', 
 '9629976d-eece-4b4c-8542-a58662660600', true, true, true, 'Canon ', 'MP1234', 'Noir', NULL, 'office', true, 
 '2026-01-09 21:07:28.094182+00', '2026-01-11 01:18:52.533102+00'),

('4b0e1bc5-bd97-40d9-8b94-415b43a85752', 'Livre de physique Chimie', 'Physics Chemistry Book', 'Physik Chemie Buch', 'Libro de Física Química', 
 'Découverte de la phtisique nucléaire et de la composition atomique de la matière', 
 'Découverte de la phtisique nucléaire et de la composition atomique de la matière', 
 'Découverte de la phtisique nucléaire et de la composition atomique de la matière', 
 'Découverte de la phtisique nucléaire et de la composition atomique de la matière', 
 15000.00, 22500.00, 33, 500, 
 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/product-images/products/1767989650403.jpg', 
 '059fad77-ff9c-4df2-a020-7cdbb417b792', true, true, true, NULL, NULL, NULL, NULL, 'school_supply', false, 
 '2026-01-09 20:16:15.772112+00', '2026-01-11 01:19:00.687064+00'),

('7f419ec0-d6bf-4566-aed2-743e39ea7f52', 'Cahier 200 pages', 'Cahier 200 pages', 'Cahier 200 pages', 'Cahier 200 pages', 
 NULL, NULL, NULL, NULL, 
 550.00, NULL, 0, 2000, 
 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/product-images/products/1767988971758.jpg', 
 '059fad77-ff9c-4df2-a020-7cdbb417b792', true, true, true, NULL, NULL, NULL, NULL, 'school_supply', false, 
 '2026-01-09 20:04:35.344869+00', '2026-01-11 01:19:05.513984+00'),

('e974c1db-2c8f-42e2-ad5a-eea25dde8d2e', 'PC portable 13ème génération', '13th Gen Laptop', 'Laptop der 13. Generation', 'Portátil de 13ª generación', 
 E'Disque dur SSD 256Gb,\nRAM 8Gb\nÉcran 10 pouces\nPliable à 360°', 
 E'Disque dur SSD 256Gb,\nRAM 8Gb\nÉcran 10 pouces\nPliable à 360°', 
 E'Disque dur SSD 256Gb,\nRAM 8Gb\nÉcran 10 pouces\nPliable à 360°', 
 E'Disque dur SSD 256Gb,\nRAM 8Gb\nÉcran 10 pouces\nPliable à 360°', 
 125000.00, 189000.00, 34, 15, 
 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/product-images/products/1767993161281.jpg', 
 '9629976d-eece-4b4c-8542-a58662660600', true, true, true, NULL, NULL, 'Blanc ', 'Silicone ', 'office', true, 
 '2026-01-09 21:12:48.219133+00', '2026-01-11 01:18:44.725729+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTIE 6: ARTICLES (ACTUALITÉS)
-- ============================================================================
INSERT INTO public.articles (id, author_id, title_fr, title_en, title_de, title_es, content_fr, content_en, content_de, content_es, excerpt_fr, excerpt_en, excerpt_de, excerpt_es, cover_image, category, status, views, likes, is_premium, price, published_at, created_at, updated_at, media) VALUES
('73b7a84f-a115-4a99-b98c-d230edd3cbcb', '24cc1ed2-040f-4ad7-8413-a416518fb684', 
 'Résultats scolaires 2024-2025 : Un taux de réussite exceptionnel !', 
 'School Results 2024-2025: An Exceptional Success Rate!', 
 'Schulergebnisse 2024-2025: Eine außergewöhnliche Erfolgsquote!', 
 '¡Resultados escolares 2024-2025: Una tasa de éxito excepcional!',
 '<h2>Résultats exceptionnels pour l''année scolaire 2024-2025</h2><p>Le Ministère de l''Éducation Nationale a publié les résultats officiels des examens nationaux. Cette année marque un tournant historique avec des taux de réussite records.</p><h3>BAC 2025</h3><p>Le taux de réussite au Baccalauréat atteint 78%, soit une augmentation de 5 points par rapport à l''année précédente.</p><h3>BEPC 2025</h3><p>Le Brevet d''Études du Premier Cycle affiche un taux de réussite de 82%, confirmant la tendance positive.</p>',
 '<h2>Exceptional results for the 2024-2025 school year</h2><p>The Ministry of National Education has published the official results of national exams.</p>',
 '<h2>Résultats exceptionnels pour l''année scolaire 2024-2025</h2><p>Le Ministère de l''Éducation Nationale a publié les résultats officiels des examens nationaux.</p>',
 '<h2>Résultats exceptionnels pour l''année scolaire 2024-2025</h2><p>Le Ministère de l''Éducation Nationale a publié les résultats officiels des examens nationaux.</p>',
 'Découvrez les résultats officiels des examens nationaux avec un taux de réussite record de 78% au BAC et 82% au BEPC.',
 'Discover the official results of national exams with a record success rate of 78% for BAC and 82% for BEPC.',
 'Découvrez les résultats officiels des examens nationaux avec un taux de réussite record de 78% au BAC et 82% au BEPC.',
 'Découvrez les résultats officiels des examens nationaux avec un taux de réussite record de 78% au BAC et 82% au BEPC.',
 'https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/article-media/images/1768774751076-0zecwc.jpg',
 'education', 'published', 248, 58, false, 0, '2026-01-18 22:21:03.199+00', '2026-01-14 06:09:00.966742+00', '2026-01-27 02:25:33.912651+00',
 '[{"type":"image","url":"https://dplhklybfdkjpwzolkzs.supabase.co/storage/v1/object/public/article-media/images/1768774751076-0zecwc.jpg"}]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FIN DU SCRIPT D'IMPORTATION
-- ============================================================================
-- Après exécution:
-- 1. Créez un utilisateur admin dans Authentication > Users
-- 2. Utilisez Bootstrap Admin (/bootstrap-admin) pour attribuer le rôle admin
-- 3. Les autres utilisateurs devront se réinscrire (mots de passe non transférables)
-- ============================================================================
