import { useState, useEffect } from "react";
import { Facebook, MessageCircle, Twitter, Link as LinkIcon, Share2, Linkedin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Platform = 'facebook' | 'whatsapp' | 'twitter' | 'linkedin' | 'telegram';

interface ShareCounts {
  facebook: number;
  whatsapp: number;
  twitter: number;
  linkedin: number;
  telegram: number;
}

interface SocialShareProps {
  title: string;
  text?: string;
  url?: string;
  variant?: "default" | "icon-only" | "mobile-bar";
  articleId?: string;
  showCounts?: boolean;
}

const getStorageKey = (articleId: string) => `share_counts_${articleId}`;

const getShareCounts = (articleId?: string): ShareCounts => {
  if (!articleId) return { facebook: 0, whatsapp: 0, twitter: 0, linkedin: 0, telegram: 0 };
  try {
    const stored = localStorage.getItem(getStorageKey(articleId));
    if (stored) return JSON.parse(stored);
  } catch {}
  return { facebook: 0, whatsapp: 0, twitter: 0, linkedin: 0, telegram: 0 };
};

const incrementShareCount = (articleId: string, platform: Platform): number => {
  const counts = getShareCounts(articleId);
  counts[platform]++;
  localStorage.setItem(getStorageKey(articleId), JSON.stringify(counts));
  return counts[platform];
};

const formatCount = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const SocialShare = ({ title, text, url, variant = "default", articleId, showCounts = false }: SocialShareProps) => {
  const shareUrl = url || window.location.href;
  const shareText = text || title;
  const [counts, setCounts] = useState<ShareCounts>({ facebook: 0, whatsapp: 0, twitter: 0, linkedin: 0, telegram: 0 });

  useEffect(() => {
    if (articleId && showCounts) {
      setCounts(getShareCounts(articleId));
    }
  }, [articleId, showCounts]);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
  };

  const handleShare = (platform: Platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    if (articleId) {
      const newCount = incrementShareCount(articleId, platform);
      setCounts(prev => ({ ...prev, [platform]: newCount }));
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl
      });
    } catch {
      handleCopyLink();
    }
  };

  // Mobile bar variant - fixed at bottom
  if (variant === "mobile-bar") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm border-t shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-4">
          <button
            onClick={() => handleShare('facebook')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Facebook size={20} className="text-[#1877F2]" />
            {showCounts && counts.facebook > 0 && (
              <span className="text-xs text-muted-foreground">{formatCount(counts.facebook)}</span>
            )}
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <MessageCircle size={20} className="text-[#25D366]" />
            {showCounts && counts.whatsapp > 0 && (
              <span className="text-xs text-muted-foreground">{formatCount(counts.whatsapp)}</span>
            )}
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Twitter size={20} className="text-[#1DA1F2]" />
            {showCounts && counts.twitter > 0 && (
              <span className="text-xs text-muted-foreground">{formatCount(counts.twitter)}</span>
            )}
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Linkedin size={20} className="text-[#0A66C2]" />
            {showCounts && counts.linkedin > 0 && (
              <span className="text-xs text-muted-foreground">{formatCount(counts.linkedin)}</span>
            )}
          </button>
          <button
            onClick={() => handleShare('telegram')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Send size={20} className="text-[#0088CC]" />
            {showCounts && counts.telegram > 0 && (
              <span className="text-xs text-muted-foreground">{formatCount(counts.telegram)}</span>
            )}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <LinkIcon size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (variant === "icon-only") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('facebook')}
            className="text-[#1877F2] hover:bg-[#1877F2]/10 bg-background shadow-md"
            title="Partager sur Facebook"
          >
            <Facebook size={18} />
          </Button>
          {showCounts && counts.facebook > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded-full min-w-[16px] text-center">
              {formatCount(counts.facebook)}
            </span>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('whatsapp')}
            className="text-[#25D366] hover:bg-[#25D366]/10 bg-background shadow-md"
            title="Partager sur WhatsApp"
          >
            <MessageCircle size={18} />
          </Button>
          {showCounts && counts.whatsapp > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded-full min-w-[16px] text-center">
              {formatCount(counts.whatsapp)}
            </span>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('twitter')}
            className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10 bg-background shadow-md"
            title="Partager sur Twitter"
          >
            <Twitter size={18} />
          </Button>
          {showCounts && counts.twitter > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded-full min-w-[16px] text-center">
              {formatCount(counts.twitter)}
            </span>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('linkedin')}
            className="text-[#0A66C2] hover:bg-[#0A66C2]/10 bg-background shadow-md"
            title="Partager sur LinkedIn"
          >
            <Linkedin size={18} />
          </Button>
          {showCounts && counts.linkedin > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded-full min-w-[16px] text-center">
              {formatCount(counts.linkedin)}
            </span>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('telegram')}
            className="text-[#0088CC] hover:bg-[#0088CC]/10 bg-background shadow-md"
            title="Partager sur Telegram"
          >
            <Send size={18} />
          </Button>
          {showCounts && counts.telegram > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded-full min-w-[16px] text-center">
              {formatCount(counts.telegram)}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyLink}
          className="bg-background shadow-md"
          title="Copier le lien"
        >
          <LinkIcon size={18} />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 size={16} />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
          <Facebook size={16} className="mr-2 text-[#1877F2]" />
          Facebook
          {showCounts && counts.facebook > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{formatCount(counts.facebook)}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer">
          <MessageCircle size={16} className="mr-2 text-[#25D366]" />
          WhatsApp
          {showCounts && counts.whatsapp > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{formatCount(counts.whatsapp)}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
          <Twitter size={16} className="mr-2 text-[#1DA1F2]" />
          Twitter / X
          {showCounts && counts.twitter > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{formatCount(counts.twitter)}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')} className="cursor-pointer">
          <Linkedin size={16} className="mr-2 text-[#0A66C2]" />
          LinkedIn
          {showCounts && counts.linkedin > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{formatCount(counts.linkedin)}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('telegram')} className="cursor-pointer">
          <Send size={16} className="mr-2 text-[#0088CC]" />
          Telegram
          {showCounts && counts.telegram > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{formatCount(counts.telegram)}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <LinkIcon size={16} className="mr-2" />
          Copier le lien
        </DropdownMenuItem>
        {'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 size={16} className="mr-2" />
            Plus d'options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShare;
