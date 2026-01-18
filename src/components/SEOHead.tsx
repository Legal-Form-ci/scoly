import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  noindex?: boolean;
}

const SEOHead = ({
  title = "Izy-scoly - Fournitures scolaires et bureautiques en Côte d'Ivoire",
  description = "Izy-scoly, votre référence en Côte d'Ivoire pour les fournitures scolaires et bureautiques de qualité. Livraison gratuite sur toutes vos commandes.",
  image = "https://storage.googleapis.com/gpt-engineer-file-uploads/N5s3POmB0UXlBsjpPjYGFV887wu2/social-images/social-1766722146657-6282.png",
  url = "https://izy-scoly.ci",
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  keywords = ["fournitures scolaires", "bureautique", "Côte d'Ivoire", "Abidjan", "livraison gratuite"],
  price,
  currency = "XOF",
  availability,
  noindex = false
}: SEOHeadProps) => {
  const fullTitle = title.includes("Izy-scoly") ? title : `${title} | Izy-scoly`;
  
  const structuredData = type === 'product' && price ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
    "description": description,
    "image": image,
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": currency,
      "availability": availability ? `https://schema.org/${availability}` : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Izy-scoly"
      }
    }
  } : type === 'article' ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "author": author ? {
      "@type": "Person",
      "name": author
    } : undefined,
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "publisher": {
      "@type": "Organization",
      "name": "Izy-scoly",
      "logo": {
        "@type": "ImageObject",
        "url": "https://izy-scoly.ci/favicon.svg"
      }
    }
  } : null;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={url} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Izy-scoly" />
      <meta property="og:locale" content="fr_CI" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Product specific */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
