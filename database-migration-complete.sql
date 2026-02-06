-- ============================================================================
-- SCRIPT DE MIGRATION COMPLET - IZY-SCOLY
-- ============================================================================
-- IMPORTANT : dans votre éditeur SQL, collez/exécutez le CONTENU de ce fichier.
-- Ne tapez pas "database-migration-complete.sql" comme une requête (sinon erreur 42601).
-- ============================================================================

-- ============================================================================
-- PARTIE 1: TYPES ET ENUMS
-- ============================================================================

-- Enum pour les rôles utilisateur
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'vendor', 'delivery');

-- Enum pour le statut des commandes
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Enum pour les catégories de ressources
CREATE TYPE public.resource_category AS ENUM ('secondary', 'university');

-- ============================================================================
-- PARTIE 2: TABLES PRINCIPALES
-- ============================================================================

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    username TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des rôles utilisateurs (SÉPARÉE pour la sécurité)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Table des catégories de produits
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    name_es TEXT NOT NULL,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des produits
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_de TEXT NOT NULL,
    name_es TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    description_de TEXT,
    description_es TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    discount_percent INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    images TEXT[],
    category_id UUID REFERENCES public.categories(id),
    vendor_id UUID,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    free_shipping BOOLEAN DEFAULT true,
    brand TEXT,
    model TEXT,
    color TEXT,
    material TEXT,
    dimensions TEXT,
    subject TEXT,
    education_level TEXT,
    education_series TEXT,
    author_name TEXT,
    author_details TEXT,
    product_type TEXT,
    product_genre TEXT,
    is_office_supply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des paramètres vendeur
CREATE TABLE public.vendor_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    store_description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    is_verified BOOLEAN DEFAULT false,
    commission_rate NUMERIC DEFAULT 10,
    total_sales NUMERIC DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    pending_payout NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vue publique des vendeurs (sans données sensibles)
CREATE VIEW public.vendor_public_info AS
SELECT 
    id, user_id, store_name, store_description, 
    logo_url, banner_url, city, is_verified
FROM public.vendor_settings;

-- Table des commandes
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    total_amount NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    status public.order_status DEFAULT 'pending',
    payment_method TEXT,
    payment_reference TEXT,
    shipping_address TEXT,
    phone TEXT,
    notes TEXT,
    coupon_code TEXT,
    delivery_user_id UUID,
    delivery_notes TEXT,
    delivery_received_at TIMESTAMPTZ,
    delivery_delivered_at TIMESTAMPTZ,
    customer_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des articles de commande
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL
);

-- Table des paiements
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    payment_reference TEXT,
    phone_number TEXT,
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des commissions
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    order_item_id UUID REFERENCES public.order_items(id),
    vendor_id UUID NOT NULL,
    sale_amount NUMERIC NOT NULL,
    commission_rate NUMERIC DEFAULT 10,
    commission_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table du panier
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table de la liste de souhaits
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- Table des avis
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des coupons
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER,
    discount_amount NUMERIC,
    min_order_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des utilisations de coupons
CREATE TABLE public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    discount_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des promotions
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT DEFAULT 'percent',
    discount_value NUMERIC NOT NULL,
    min_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    applies_to TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des articles (blog/actualités)
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id),
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    title_es TEXT NOT NULL,
    content_fr TEXT,
    content_en TEXT,
    content_de TEXT,
    content_es TEXT,
    excerpt_fr TEXT,
    excerpt_en TEXT,
    excerpt_de TEXT,
    excerpt_es TEXT,
    cover_image TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'draft',
    rejection_reason TEXT,
    media JSONB DEFAULT '[]',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des commentaires d'articles
CREATE TABLE public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des likes d'articles
CREATE TABLE public.article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (article_id, user_id)
);

-- Table des réactions aux articles
CREATE TABLE public.article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (article_id, user_id, reaction_type)
);

-- Table des partages d'articles
CREATE TABLE public.article_share_counts (
    article_id UUID PRIMARY KEY REFERENCES public.articles(id) ON DELETE CASCADE,
    facebook INTEGER DEFAULT 0,
    whatsapp INTEGER DEFAULT 0,
    twitter INTEGER DEFAULT 0,
    linkedin INTEGER DEFAULT 0,
    telegram INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des achats d'articles premium
CREATE TABLE public.article_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    payment_id UUID REFERENCES public.payments(id),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des publicités
CREATE TABLE public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    media_type TEXT DEFAULT 'image',
    media_url TEXT,
    link_url TEXT,
    link_text TEXT DEFAULT 'En savoir plus',
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des campagnes marketing
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'banner',
    target_audience TEXT DEFAULT 'all',
    content JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des ressources éducatives
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    title_es TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    description_de TEXT,
    description_es TEXT,
    category public.resource_category NOT NULL,
    subject TEXT,
    grade_level TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size INTEGER,
    is_free BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'order',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des abonnements push
CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des sessions de connexion
CREATE TABLE public.login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    device_info TEXT,
    is_confirmed BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des limites de taux (rate limiting)
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action_type TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMPTZ DEFAULT now(),
    last_attempt_at TIMESTAMPTZ DEFAULT now(),
    blocked_until TIMESTAMPTZ,
    UNIQUE (identifier, action_type)
);

-- Table des logs d'audit
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des preuves de livraison
CREATE TABLE public.delivery_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    delivery_user_id UUID NOT NULL,
    proof_type TEXT NOT NULL,
    recipient_name TEXT,
    recipient_photo_url TEXT,
    recipient_cni_photo_url TEXT,
    signature_url TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    location_address TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des logs d'emails
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Table FAQ
CREATE TABLE public.faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_fr TEXT NOT NULL,
    question_en TEXT,
    answer_fr TEXT NOT NULL,
    answer_en TEXT,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des messages internes
CREATE TABLE public.internal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    parent_id UUID REFERENCES public.internal_messages(id),
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des notes de modération
CREATE TABLE public.moderator_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES auth.users(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    note TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des paramètres de la plateforme
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des récompenses fidélité
CREATE TABLE public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reward_type TEXT NOT NULL,
    points_spent INTEGER NOT NULL,
    coupon_code TEXT,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTIE 3: FONCTIONS DE SÉCURITÉ
-- ============================================================================

-- Fonction pour vérifier les rôles (SECURITY DEFINER pour éviter la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name');
  
  -- Assigner le rôle utilisateur par défaut
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction de vérification des limites de taux
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier TEXT,
  _action_type TEXT,
  _max_attempts INTEGER DEFAULT 5,
  _window_seconds INTEGER DEFAULT 300,
  _block_seconds INTEGER DEFAULT 900
)
RETURNS TABLE(allowed BOOLEAN, remaining_attempts INTEGER, blocked_until TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ := v_now - (_window_seconds || ' seconds')::INTERVAL;
BEGIN
  SELECT * INTO v_record FROM public.rate_limits
  WHERE identifier = _identifier AND action_type = _action_type;
  
  IF v_record.id IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempts, first_attempt_at, last_attempt_at)
    VALUES (_identifier, _action_type, 1, v_now, v_now);
    RETURN QUERY SELECT true, _max_attempts - 1, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN QUERY SELECT false, 0, v_record.blocked_until;
    RETURN;
  END IF;
  
  IF v_record.first_attempt_at < v_window_start THEN
    UPDATE public.rate_limits
    SET attempts = 1, first_attempt_at = v_now, last_attempt_at = v_now, blocked_until = NULL
    WHERE id = v_record.id;
    RETURN QUERY SELECT true, _max_attempts - 1, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  IF v_record.attempts >= _max_attempts THEN
    UPDATE public.rate_limits
    SET blocked_until = v_now + (_block_seconds || ' seconds')::INTERVAL, last_attempt_at = v_now
    WHERE id = v_record.id;
    RETURN QUERY SELECT false, 0, v_now + (_block_seconds || ' seconds')::INTERVAL;
    RETURN;
  END IF;
  
  UPDATE public.rate_limits SET attempts = attempts + 1, last_attempt_at = v_now WHERE id = v_record.id;
  RETURN QUERY SELECT true, _max_attempts - v_record.attempts - 1, NULL::TIMESTAMPTZ;
END;
$$;

-- Fonction pour valider un coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(_code TEXT, _order_total NUMERIC)
RETURNS TABLE(coupon_id UUID, discount_amount NUMERIC, discount_percent INTEGER, discount_value NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  v_discount NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO c FROM public.coupons
  WHERE code = _code
    AND COALESCE(is_active, true) = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (min_order_amount IS NULL OR _order_total >= min_order_amount)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon';
  END IF;

  IF c.max_uses IS NOT NULL AND COALESCE(c.used_count, 0) >= c.max_uses THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;

  v_discount := 0;
  IF c.discount_percent IS NOT NULL AND c.discount_percent > 0 THEN
    v_discount := round((_order_total * c.discount_percent / 100.0)::NUMERIC, 0);
  ELSIF c.discount_amount IS NOT NULL AND c.discount_amount > 0 THEN
    v_discount := c.discount_amount;
  END IF;

  IF v_discount > _order_total THEN
    v_discount := _order_total;
  END IF;

  RETURN QUERY SELECT c.id, v_discount, COALESCE(c.discount_percent, 0), COALESCE(c.discount_amount, 0);
END;
$$;

-- Fonction pour obtenir les statistiques admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(
  total_products BIGINT,
  total_orders BIGINT,
  total_users BIGINT,
  total_revenue NUMERIC,
  monthly_revenue NUMERIC,
  pending_orders BIGINT,
  total_articles BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.products WHERE is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM public.orders)::BIGINT,
    (SELECT COUNT(*) FROM public.profiles)::BIGINT,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'delivered'),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM public.articles WHERE status = 'published')::BIGINT;
END;
$$;

-- Fonction pour les points de fidélité
CREATE OR REPLACE FUNCTION public.get_user_loyalty_points()
RETURNS TABLE(total_earned INTEGER, total_spent INTEGER, available INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_earned INTEGER;
  v_spent INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  SELECT COALESCE(FLOOR(SUM(total_amount) / 1000), 0)::INTEGER INTO v_earned
  FROM public.orders WHERE user_id = v_user_id AND status = 'delivered';

  SELECT COALESCE(SUM(points_spent), 0)::INTEGER INTO v_spent
  FROM public.loyalty_rewards WHERE user_id = v_user_id;

  RETURN QUERY SELECT v_earned, v_spent, (v_earned - v_spent);
END;
$$;

-- Fonction pour échanger des points fidélité
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(_reward_type TEXT, _points_required INTEGER)
RETURNS TABLE(success BOOLEAN, reward_id UUID, coupon_code TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_available_points INTEGER;
  v_new_reward_id UUID;
  v_coupon TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Authentification requise'::TEXT;
    RETURN;
  END IF;

  SELECT COALESCE(FLOOR(SUM(total_amount) / 1000), 0)::INTEGER INTO v_available_points
  FROM public.orders WHERE user_id = v_user_id AND status = 'delivered';

  v_available_points := v_available_points - COALESCE(
    (SELECT SUM(points_spent) FROM public.loyalty_rewards WHERE user_id = v_user_id), 0
  );

  IF v_available_points < _points_required THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 
      ('Points insuffisants. Vous avez ' || v_available_points || ' points disponibles.')::TEXT;
    RETURN;
  END IF;

  v_coupon := 'LOYALTY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  INSERT INTO public.loyalty_rewards (user_id, reward_type, points_spent, coupon_code)
  VALUES (v_user_id, _reward_type, _points_required, v_coupon)
  RETURNING id INTO v_new_reward_id;

  RETURN QUERY SELECT true, v_new_reward_id, v_coupon, 'Récompense échangée avec succès!'::TEXT;
END;
$$;

-- Fonction pour les statistiques de partage
CREATE OR REPLACE FUNCTION public.increment_article_share(_article_id UUID, _platform TEXT)
RETURNS public.article_share_counts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.article_share_counts;
  v_user_id UUID;
  v_rate_check RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _platform NOT IN ('facebook','whatsapp','twitter','linkedin','telegram') THEN
    RAISE EXCEPTION 'Unsupported platform: %', _platform;
  END IF;

  SELECT * INTO v_rate_check FROM public.check_rate_limit(
    v_user_id::TEXT || '_share_' || _article_id::TEXT, 'article_share', 10, 3600, 1800
  );
  
  IF NOT v_rate_check.allowed THEN
    RAISE EXCEPTION 'Rate limit exceeded. Try again later.';
  END IF;

  INSERT INTO public.article_share_counts (article_id)
  VALUES (_article_id) ON CONFLICT (article_id) DO NOTHING;

  UPDATE public.article_share_counts SET
    facebook = facebook + CASE WHEN _platform = 'facebook' THEN 1 ELSE 0 END,
    whatsapp = whatsapp + CASE WHEN _platform = 'whatsapp' THEN 1 ELSE 0 END,
    twitter = twitter + CASE WHEN _platform = 'twitter' THEN 1 ELSE 0 END,
    linkedin = linkedin + CASE WHEN _platform = 'linkedin' THEN 1 ELSE 0 END,
    telegram = telegram + CASE WHEN _platform = 'telegram' THEN 1 ELSE 0 END,
    total = total + 1
  WHERE article_id = _article_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Fonction pour les commandes de livraison
CREATE OR REPLACE FUNCTION public.get_delivery_orders(_delivery_user_id UUID)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE delivery_user_id = _delivery_user_id
  ORDER BY created_at DESC;
$$;

-- Fonction pour les stats de livraison
CREATE OR REPLACE FUNCTION public.get_delivery_stats(_delivery_user_id UUID)
RETURNS TABLE(total_assigned BIGINT, pending_pickup BIGINT, in_transit BIGINT, delivered BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NOT NULL AND delivery_delivered_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_delivered_at IS NOT NULL)::BIGINT
  FROM public.orders WHERE delivery_user_id = _delivery_user_id;
$$;

-- ============================================================================
-- PARTIE 4: TRIGGERS
-- ============================================================================

-- Triggers de mise à jour automatique
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_settings_updated_at BEFORE UPDATE ON public.vendor_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour notifier admin des nouvelles commandes
CREATE OR REPLACE FUNCTION public.notify_admin_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_id, 'order', 'Nouvelle commande',
      'Une nouvelle commande de ' || NEW.total_amount || ' FCFA a été passée.',
      jsonb_build_object('order_id', NEW.id, 'amount', NEW.total_amount)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_order();

-- Fonction pour calculer les commissions
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id UUID;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  SELECT vendor_id INTO v_vendor_id FROM public.products WHERE id = NEW.product_id;
  
  IF v_vendor_id IS NOT NULL THEN
    SELECT COALESCE(vs.commission_rate, 10) INTO v_commission_rate
    FROM public.vendor_settings vs WHERE vs.user_id = v_vendor_id;
    
    IF v_commission_rate IS NULL THEN v_commission_rate := 10; END IF;
    
    v_commission_amount := NEW.total_price * (v_commission_rate / 100);
    
    INSERT INTO public.commissions (order_id, vendor_id, order_item_id, sale_amount, commission_rate, commission_amount)
    VALUES (NEW.order_id, v_vendor_id, NEW.id, NEW.total_price, v_commission_rate, v_commission_amount);
    
    UPDATE public.vendor_settings SET 
      total_sales = total_sales + NEW.total_price,
      pending_payout = pending_payout + (NEW.total_price - v_commission_amount),
      updated_at = now()
    WHERE user_id = v_vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_commission();

-- ============================================================================
-- PARTIE 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_share_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS - PROFILES
-- ============================================================================
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- POLITIQUES RLS - USER_ROLES
-- ============================================================================
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - CATEGORIES
-- ============================================================================
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - PRODUCTS
-- ============================================================================
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors can manage their products" ON public.products FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - VENDOR_SETTINGS
-- ============================================================================
CREATE POLICY "Vendors can manage their settings" ON public.vendor_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all vendor settings" ON public.vendor_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view full vendor details" ON public.vendor_settings FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - ORDERS
-- ============================================================================
CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can confirm their orders" ON public.orders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delivery users can view assigned orders" ON public.orders FOR SELECT 
  USING ((delivery_user_id = auth.uid()) OR (user_id = auth.uid()) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Delivery users can update delivery status" ON public.orders FOR UPDATE 
  USING (delivery_user_id = auth.uid()) WITH CHECK (delivery_user_id = auth.uid());
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - ORDER_ITEMS
-- ============================================================================
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - PAYMENTS
-- ============================================================================
CREATE POLICY "Users can view their payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - COMMISSIONS
-- ============================================================================
CREATE POLICY "Vendors can view their commissions" ON public.commissions FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Admins can manage all commissions" ON public.commissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - CART_ITEMS & WISHLIST
-- ============================================================================
CREATE POLICY "Users can manage their cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - REVIEWS
-- ============================================================================
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage their reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - COUPONS & PROMOTIONS
-- ============================================================================
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING ((is_active = true) AND ((end_date IS NULL) OR (end_date > now())));
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - COUPON_REDEMPTIONS
-- ============================================================================
CREATE POLICY "Users can view their coupon redemptions" ON public.coupon_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their coupon redemptions" ON public.coupon_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all coupon redemptions" ON public.coupon_redemptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - ARTICLES
-- ============================================================================
CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage their articles" ON public.articles FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all articles" ON public.articles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - ARTICLE_COMMENTS
-- ============================================================================
CREATE POLICY "Anyone can view approved comments" ON public.article_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create comments" ON public.article_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their comments" ON public.article_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all comments" ON public.article_comments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - ARTICLE_LIKES & REACTIONS
-- ============================================================================
CREATE POLICY "Anyone can view likes" ON public.article_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their likes" ON public.article_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view reactions" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their reactions" ON public.article_reactions FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - ARTICLE_SHARE_COUNTS
-- ============================================================================
CREATE POLICY "Article share counts are viewable by everyone" ON public.article_share_counts FOR SELECT USING (true);

-- ============================================================================
-- POLITIQUES RLS - ARTICLE_PURCHASES
-- ============================================================================
CREATE POLICY "Users can view their article purchases" ON public.article_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create article purchases" ON public.article_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all article purchases" ON public.article_purchases FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - ADVERTISEMENTS
-- ============================================================================
CREATE POLICY "Anyone can view active advertisements" ON public.advertisements FOR SELECT 
  USING ((is_active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at >= now())));
CREATE POLICY "Admins can manage advertisements" ON public.advertisements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - CAMPAIGNS
-- ============================================================================
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - RESOURCES
-- ============================================================================
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins can manage all resources" ON public.resources FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - NOTIFICATIONS
-- ============================================================================
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create their notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - PUSH_SUBSCRIPTIONS
-- ============================================================================
CREATE POLICY "Users can manage their subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - LOGIN_SESSIONS
-- ============================================================================
CREATE POLICY "Users can view their login sessions" ON public.login_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert login sessions" ON public.login_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their login sessions" ON public.login_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - RATE_LIMITS (accès via fonction uniquement)
-- ============================================================================
CREATE POLICY "No direct access" ON public.rate_limits FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- POLITIQUES RLS - AUDIT_LOGS
-- ============================================================================
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - DELIVERY_PROOFS
-- ============================================================================
CREATE POLICY "Delivery users can create proofs" ON public.delivery_proofs FOR INSERT WITH CHECK (auth.uid() = delivery_user_id);
CREATE POLICY "Delivery users can view their proofs" ON public.delivery_proofs FOR SELECT 
  USING ((auth.uid() = delivery_user_id) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'vendor'));
CREATE POLICY "Admins can manage all proofs" ON public.delivery_proofs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - EMAIL_LOGS
-- ============================================================================
CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true);

-- ============================================================================
-- POLITIQUES RLS - FAQ
-- ============================================================================
CREATE POLICY "Anyone can view active FAQ" ON public.faq FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage FAQ" ON public.faq FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - INTERNAL_MESSAGES
-- ============================================================================
CREATE POLICY "Users can view their messages" ON public.internal_messages FOR SELECT USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
CREATE POLICY "Users can send messages" ON public.internal_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON public.internal_messages FOR UPDATE USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
CREATE POLICY "Admins can manage all messages" ON public.internal_messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - MODERATOR_NOTES
-- ============================================================================
CREATE POLICY "Moderators can manage notes" ON public.moderator_notes FOR ALL 
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can view notes on their products" ON public.moderator_notes FOR SELECT 
  USING ((entity_type = 'product') AND (EXISTS (SELECT 1 FROM products WHERE products.id = moderator_notes.entity_id AND products.vendor_id = auth.uid())));

-- ============================================================================
-- POLITIQUES RLS - PLATFORM_SETTINGS
-- ============================================================================
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- POLITIQUES RLS - LOYALTY_REWARDS
-- ============================================================================
CREATE POLICY "Users can view their rewards" ON public.loyalty_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can redeem rewards" ON public.loyalty_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can use their rewards" ON public.loyalty_rewards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all rewards" ON public.loyalty_rewards FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PARTIE 6: STORAGE BUCKETS
-- ============================================================================

-- Créer les buckets de stockage
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('article-media', 'article-media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('advertisement-media', 'advertisement-media', true) ON CONFLICT DO NOTHING;

-- Politiques de stockage pour product-images
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated can upload product images" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Owners can update product images" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can delete product images" ON storage.objects FOR DELETE 
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politiques de stockage pour article-images
CREATE POLICY "Public can view article images" ON storage.objects FOR SELECT USING (bucket_id = 'article-images');
CREATE POLICY "Authenticated can upload article images" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

-- Politiques de stockage pour article-media
CREATE POLICY "Public can view article media" ON storage.objects FOR SELECT USING (bucket_id = 'article-media');
CREATE POLICY "Authenticated can upload article media" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'article-media' AND auth.role() = 'authenticated');

-- Politiques de stockage pour advertisement-media
CREATE POLICY "Public can view advertisement media" ON storage.objects FOR SELECT USING (bucket_id = 'advertisement-media');
CREATE POLICY "Admins can manage advertisement media" ON storage.objects FOR ALL 
  USING (bucket_id = 'advertisement-media' AND has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PARTIE 7: DONNÉES INITIALES
-- ============================================================================

-- Paramètres de la plateforme par défaut
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('site_name', 'Izy-scoly', 'Nom du site'),
  ('site_description', 'Plateforme éducative et e-commerce', 'Description du site'),
  ('currency', 'FCFA', 'Devise'),
  ('free_shipping_threshold', '25000', 'Seuil de livraison gratuite'),
  ('commission_rate', '10', 'Taux de commission par défaut')
ON CONFLICT (key) DO NOTHING;

-- Catégories par défaut
INSERT INTO public.categories (slug, name_fr, name_en, name_de, name_es) VALUES
  ('livres-scolaires', 'Livres scolaires', 'School books', 'Schulbücher', 'Libros escolares'),
  ('fournitures', 'Fournitures scolaires', 'School supplies', 'Schulmaterial', 'Material escolar'),
  ('uniformes', 'Uniformes', 'Uniforms', 'Uniformen', 'Uniformes'),
  ('electronique', 'Électronique', 'Electronics', 'Elektronik', 'Electrónica'),
  ('bureautique', 'Bureautique', 'Office supplies', 'Bürobedarf', 'Material de oficina')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- IMPORTANT: Après exécution, configurez les secrets Edge Functions dans:
-- Settings > Edge Functions > Secrets:
-- - RESEND_API_KEY
-- - KKIAPAY_PUBLIC_KEY  
-- - KKIAPAY_PRIVATE_KEY
-- - KKIAPAY_SECRET
-- - BOOTSTRAP_ADMIN_TOKEN
-- ============================================================================
