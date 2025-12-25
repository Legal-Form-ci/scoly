import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  User,
  Loader2,
  Minimize2,
  Maximize2,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis **ScIA**, votre assistant virtuel Scoly. 🎓\n\nJe suis là pour vous aider avec :\n- 📚 Vos questions sur les produits\n- 🛒 Le suivi de vos commandes\n- 💳 Les méthodes de paiement\n- ✍️ La publication d'articles\n- ❓ Toute autre question\n\nComment puis-je vous aider aujourd'hui ?",
  timestamp: new Date(),
};

const QUICK_RESPONSES: { [key: string]: string } = {
  "livraison": "📦 **Livraison gratuite partout en Côte d'Ivoire !**\n\n- Abidjan : 24-48h\n- Autres villes : 3-5 jours ouvrés\n\nVous recevrez un SMS de confirmation dès l'expédition de votre commande.",
  "paiement": "💳 **Modes de paiement acceptés :**\n\n- 🟠 Orange Money\n- 🟡 MTN Mobile Money\n- 🔵 Moov Money\n- 🟢 Wave\n\nToutes les transactions sont 100% sécurisées via FedaPay.",
  "commande": "🛒 **Pour passer une commande :**\n\n1. Parcourez notre boutique\n2. Ajoutez des produits au panier\n3. Validez votre commande\n4. Payez via Mobile Money\n5. Recevez votre confirmation par SMS\n\nVous pouvez suivre votre commande dans 'Mon compte'.",
  "article": "✍️ **Pour publier un article :**\n\n1. Connectez-vous à votre compte\n2. Accédez à l'Espace Auteur\n3. Créez votre article avec l'éditeur\n4. Soumettez pour révision\n\nNotre équipe examinera votre article sous 48h.",
  "contact": "📞 **Nous contacter :**\n\n- WhatsApp : +225 07 59 56 60 87\n- Email : contact@scoly.ci\n- Horaires : Lun-Ven 8h-18h\n\nJe reste également disponible 24/7 ici !",
  "premium": "⭐ **Articles Premium :**\n\nCertains articles de qualité sont payants. Une fois achetés, ils restent accessibles indéfiniment dans votre compte.\n\nLe paiement se fait via Mobile Money de manière sécurisée.",
  "retour": "↩️ **Politique de retour :**\n\nVous disposez de 7 jours après réception pour retourner un produit :\n- Non utilisé\n- Dans son emballage d'origine\n\nContactez le service client pour organiser le retour.",
};

const ScIA = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const findResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Check for keywords
    for (const [keyword, response] of Object.entries(QUICK_RESPONSES)) {
      if (lowerQuery.includes(keyword)) {
        return response;
      }
    }

    // Check for greetings
    if (lowerQuery.match(/bonjour|salut|hello|hi|coucou/)) {
      return "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?";
    }

    // Check for thanks
    if (lowerQuery.match(/merci|thanks|super|génial|parfait/)) {
      return "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.";
    }

    // Check for goodbye
    if (lowerQuery.match(/au revoir|bye|à bientôt|adieu/)) {
      return "Au revoir ! 👋 À bientôt sur Scoly !";
    }

    // Default response
    return "Je n'ai pas trouvé de réponse précise à votre question. Voici ce que je peux vous proposer :\n\n- 📞 Contacter le support : +225 07 59 56 60 87\n- 📧 Email : contact@scoly.ci\n- ❓ Consulter notre FAQ\n\nPouvez-vous reformuler votre question ?";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = findResponse(userMessage.content);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {i < content.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  const quickActions = [
    { label: "Livraison", query: "livraison" },
    { label: "Paiement", query: "paiement" },
    { label: "Commander", query: "commande" },
    { label: "Contact", query: "contact" },
  ];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 group"
            >
              <div className="relative">
                <Bot className="h-6 w-6 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </Button>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
            >
              <p className="text-sm font-medium">Besoin d'aide ? 💬</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              isExpanded 
                ? "inset-4 md:inset-8" 
                : "bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh]"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="h-6 w-6" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      ScIA
                      <Sparkles className="h-4 w-4" />
                    </h3>
                    <p className="text-xs text-primary-foreground/80">Assistant Scoly • En ligne</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                  >
                    {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-gradient-to-br from-primary/20 to-secondary/20"
                    )}>
                      {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}>
                      <div className="text-sm leading-relaxed">
                        {renderMessage(message.content)}
                      </div>
                      <p className={cn(
                        "text-[10px] mt-1",
                        message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">ScIA réfléchit...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick actions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.query}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => {
                        setInput(action.query);
                        setTimeout(handleSend, 100);
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message..."
                  className="rounded-full bg-background"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full h-10 w-10 p-0"
                >
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Propulsé par Scoly • Réponses instantanées 24/7
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScIA;
