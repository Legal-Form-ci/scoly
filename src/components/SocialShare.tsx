import { Facebook, MessageCircle, Twitter, Link as LinkIcon, Share2, Linkedin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SocialShareProps {
  title: string;
  text?: string;
  url?: string;
  variant?: "default" | "icon-only";
}

const SocialShare = ({ title, text, url, variant = "default" }: SocialShareProps) => {
  const shareUrl = url || window.location.href;
  const shareText = text || title;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
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

  if (variant === "icon-only") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('facebook')}
          className="text-[#1877F2] hover:bg-[#1877F2]/10 bg-background shadow-md"
          title="Partager sur Facebook"
        >
          <Facebook size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('whatsapp')}
          className="text-[#25D366] hover:bg-[#25D366]/10 bg-background shadow-md"
          title="Partager sur WhatsApp"
        >
          <MessageCircle size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('twitter')}
          className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10 bg-background shadow-md"
          title="Partager sur Twitter"
        >
          <Twitter size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('linkedin')}
          className="text-[#0A66C2] hover:bg-[#0A66C2]/10 bg-background shadow-md"
          title="Partager sur LinkedIn"
        >
          <Linkedin size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('telegram')}
          className="text-[#0088CC] hover:bg-[#0088CC]/10 bg-background shadow-md"
          title="Partager sur Telegram"
        >
          <Send size={18} />
        </Button>
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
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer">
          <MessageCircle size={16} className="mr-2 text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
          <Twitter size={16} className="mr-2 text-[#1DA1F2]" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')} className="cursor-pointer">
          <Linkedin size={16} className="mr-2 text-[#0A66C2]" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('telegram')} className="cursor-pointer">
          <Send size={16} className="mr-2 text-[#0088CC]" />
          Telegram
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
