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
  Star,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ScIA = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const texts = {
    fr: {
      welcome: "Bonjour ! Je suis **ScIA**, votre assistant virtuel Izy-scoly. 🎓\n\nJe suis là pour vous aider avec :\n- 📚 Vos questions sur les produits\n- 🛒 Le suivi de vos commandes\n- 💳 Les méthodes de paiement\n- ✍️ La publication d'actualités\n- ❓ Toute autre question\n\nComment puis-je vous aider aujourd'hui ?",
      delivery: "📦 **Livraison gratuite partout en Côte d'Ivoire !**\n\n- Abidjan : 24-48h\n- Autres villes : 3-5 jours ouvrés\n\nVous recevrez un SMS de confirmation dès l'expédition de votre commande.",
      payment: "💳 **Modes de paiement acceptés :**\n\n- 🟠 Orange Money\n- 🟡 MTN Mobile Money\n- 🔵 Moov Money\n- 🟢 Wave\n\nToutes les transactions sont 100% sécurisées via KkiaPay.",
      order: "🛒 **Pour passer une commande :**\n\n1. Parcourez notre boutique\n2. Ajoutez des produits au panier\n3. Validez votre commande\n4. Payez via Mobile Money\n5. Recevez votre confirmation par SMS\n\nVous pouvez suivre votre commande dans 'Mon compte'.",
      article: "✍️ **Pour publier une actualité :**\n\n1. Connectez-vous à votre compte\n2. Accédez à l'Espace Auteur\n3. Créez votre article avec l'éditeur\n4. Soumettez pour révision\n\nNotre équipe examinera votre article sous 48h.",
      contact: "📞 **Nous contacter :**\n\n- WhatsApp : +225 07 59 56 60 87\n- Email : contact@izy-scoly.ci\n- Horaires : Lun-Ven 8h-18h\n\nJe reste également disponible 24/7 ici !",
      premium: "⭐ **Articles Premium :**\n\nCertains articles de qualité sont payants. Une fois achetés, ils restent accessibles indéfiniment dans votre compte.\n\nLe paiement se fait via Mobile Money de manière sécurisée.",
      return: "↩️ **Politique de retour :**\n\nVous disposez de 7 jours après réception pour retourner un produit :\n- Non utilisé\n- Dans son emballage d'origine\n\nContactez le service client pour organiser le retour.",
      greeting: "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?",
      thanks: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
      goodbye: "Au revoir ! 👋 À bientôt sur Izy-scoly !",
      default: "Je n'ai pas trouvé de réponse précise à votre question. Voici ce que je peux vous proposer :\n\n- 📞 Contacter le support : +225 07 59 56 60 87\n- 📧 Email : contact@izy-scoly.ci\n- ❓ Consulter notre FAQ\n\nPouvez-vous reformuler votre question ?",
      placeholder: "Écrivez votre message...",
      thinking: "ScIA réfléchit...",
      poweredBy: "Propulsé par Izy-scoly • Réponses instantanées 24/7",
      needHelp: "Besoin d'aide ?",
      online: "Assistant Izy-scoly • En ligne",
      endConversation: "Terminer",
      newConversation: "Nouvelle conversation",
      rateTitle: "Comment évaluez-vous cette conversation ?",
      rateThank: "Merci pour votre évaluation !",
      quickDelivery: "Livraison",
      quickPayment: "Paiement",
      quickOrder: "Commander",
      quickContact: "Contact",
    },
    en: {
      welcome: "Hello! I'm **ScIA**, your Izy-scoly virtual assistant. 🎓\n\nI'm here to help you with:\n- 📚 Your questions about products\n- 🛒 Order tracking\n- 💳 Payment methods\n- ✍️ Publishing news\n- ❓ Any other questions\n\nHow can I help you today?",
      delivery: "📦 **Free delivery throughout Ivory Coast!**\n\n- Abidjan: 24-48h\n- Other cities: 3-5 business days\n\nYou'll receive an SMS confirmation once your order is shipped.",
      payment: "💳 **Accepted payment methods:**\n\n- 🟠 Orange Money\n- 🟡 MTN Mobile Money\n- 🔵 Moov Money\n- 🟢 Wave\n\nAll transactions are 100% secure via KkiaPay.",
      order: "🛒 **To place an order:**\n\n1. Browse our shop\n2. Add products to cart\n3. Validate your order\n4. Pay via Mobile Money\n5. Receive your SMS confirmation\n\nYou can track your order in 'My Account'.",
      article: "✍️ **To publish news:**\n\n1. Log into your account\n2. Go to Author Space\n3. Create your article with the editor\n4. Submit for review\n\nOur team will review your article within 48h.",
      contact: "📞 **Contact us:**\n\n- WhatsApp: +225 07 59 56 60 87\n- Email: contact@izy-scoly.ci\n- Hours: Mon-Fri 8am-6pm\n\nI'm also available 24/7 here!",
      premium: "⭐ **Premium Articles:**\n\nSome quality articles are paid. Once purchased, they remain accessible forever in your account.\n\nPayment is made securely via Mobile Money.",
      return: "↩️ **Return Policy:**\n\nYou have 7 days after receipt to return a product:\n- Unused\n- In original packaging\n\nContact customer service to arrange the return.",
      greeting: "Hello! 👋 How can I help you today?",
      thanks: "My pleasure! 😊 Don't hesitate if you have more questions.",
      goodbye: "Goodbye! 👋 See you soon on Izy-scoly!",
      default: "I couldn't find a precise answer to your question. Here's what I can offer:\n\n- 📞 Contact support: +225 07 59 56 60 87\n- 📧 Email: contact@izy-scoly.ci\n- ❓ Check our FAQ\n\nCould you rephrase your question?",
      placeholder: "Type your message...",
      thinking: "ScIA is thinking...",
      poweredBy: "Powered by Izy-scoly • Instant responses 24/7",
      needHelp: "Need help?",
      online: "Izy-scoly Assistant • Online",
      endConversation: "End",
      newConversation: "New conversation",
      rateTitle: "How do you rate this conversation?",
      rateThank: "Thank you for your feedback!",
      quickDelivery: "Delivery",
      quickPayment: "Payment",
      quickOrder: "Order",
      quickContact: "Contact",
    },
    de: {
      welcome: "Hallo! Ich bin **ScIA**, Ihr virtueller Izy-scoly-Assistent. 🎓\n\nIch bin hier, um Ihnen zu helfen mit:\n- 📚 Ihren Fragen zu Produkten\n- 🛒 Bestellverfolgung\n- 💳 Zahlungsmethoden\n- ✍️ Nachrichten veröffentlichen\n- ❓ Allen anderen Fragen\n\nWie kann ich Ihnen heute helfen?",
      delivery: "📦 **Kostenlose Lieferung in der gesamten Elfenbeinküste!**\n\n- Abidjan: 24-48 Std.\n- Andere Städte: 3-5 Werktage\n\nSie erhalten eine SMS-Bestätigung, sobald Ihre Bestellung versandt wird.",
      payment: "💳 **Akzeptierte Zahlungsmethoden:**\n\n- 🟠 Orange Money\n- 🟡 MTN Mobile Money\n- 🔵 Moov Money\n- 🟢 Wave\n\nAlle Transaktionen sind 100% sicher über KkiaPay.",
      order: "🛒 **Um eine Bestellung aufzugeben:**\n\n1. Durchsuchen Sie unseren Shop\n2. Fügen Sie Produkte zum Warenkorb hinzu\n3. Bestätigen Sie Ihre Bestellung\n4. Zahlen Sie per Mobile Money\n5. Erhalten Sie Ihre SMS-Bestätigung\n\nSie können Ihre Bestellung in 'Mein Konto' verfolgen.",
      article: "✍️ **Um Nachrichten zu veröffentlichen:**\n\n1. Melden Sie sich in Ihrem Konto an\n2. Gehen Sie zum Autorenbereich\n3. Erstellen Sie Ihren Artikel mit dem Editor\n4. Senden Sie zur Überprüfung\n\nUnser Team wird Ihren Artikel innerhalb von 48 Stunden prüfen.",
      contact: "📞 **Kontaktieren Sie uns:**\n\n- WhatsApp: +225 07 59 56 60 87\n- E-Mail: contact@izy-scoly.ci\n- Öffnungszeiten: Mo-Fr 8-18 Uhr\n\nIch bin auch hier rund um die Uhr verfügbar!",
      premium: "⭐ **Premium-Artikel:**\n\nEinige Qualitätsartikel sind kostenpflichtig. Einmal gekauft, bleiben sie für immer in Ihrem Konto zugänglich.\n\nDie Zahlung erfolgt sicher per Mobile Money.",
      return: "↩️ **Rückgaberichtlinie:**\n\nSie haben 7 Tage nach Erhalt, um ein Produkt zurückzugeben:\n- Unbenutzt\n- In Originalverpackung\n\nKontaktieren Sie den Kundendienst, um die Rücksendung zu arrangieren.",
      greeting: "Hallo! 👋 Wie kann ich Ihnen heute helfen?",
      thanks: "Gern geschehen! 😊 Zögern Sie nicht, wenn Sie weitere Fragen haben.",
      goodbye: "Auf Wiedersehen! 👋 Bis bald bei Izy-scoly!",
      default: "Ich konnte keine genaue Antwort auf Ihre Frage finden. Hier ist, was ich anbieten kann:\n\n- 📞 Support kontaktieren: +225 07 59 56 60 87\n- 📧 E-Mail: contact@izy-scoly.ci\n- ❓ Unsere FAQ prüfen\n\nKönnten Sie Ihre Frage umformulieren?",
      placeholder: "Nachricht eingeben...",
      thinking: "ScIA denkt nach...",
      poweredBy: "Betrieben von Izy-scoly • Sofortige Antworten 24/7",
      needHelp: "Brauchen Sie Hilfe?",
      online: "Izy-scoly Assistent • Online",
      endConversation: "Beenden",
      newConversation: "Neues Gespräch",
      rateTitle: "Wie bewerten Sie dieses Gespräch?",
      rateThank: "Danke für Ihr Feedback!",
      quickDelivery: "Lieferung",
      quickPayment: "Zahlung",
      quickOrder: "Bestellen",
      quickContact: "Kontakt",
    },
    es: {
      welcome: "¡Hola! Soy **ScIA**, tu asistente virtual de Izy-scoly. 🎓\n\nEstoy aquí para ayudarte con:\n- 📚 Tus preguntas sobre productos\n- 🛒 Seguimiento de pedidos\n- 💳 Métodos de pago\n- ✍️ Publicar noticias\n- ❓ Cualquier otra pregunta\n\n¿Cómo puedo ayudarte hoy?",
      delivery: "📦 **¡Entrega gratuita en toda Costa de Marfil!**\n\n- Abidjan: 24-48h\n- Otras ciudades: 3-5 días hábiles\n\nRecibirás una confirmación por SMS cuando se envíe tu pedido.",
      payment: "💳 **Métodos de pago aceptados:**\n\n- 🟠 Orange Money\n- 🟡 MTN Mobile Money\n- 🔵 Moov Money\n- 🟢 Wave\n\nTodas las transacciones son 100% seguras a través de KkiaPay.",
      order: "🛒 **Para hacer un pedido:**\n\n1. Explora nuestra tienda\n2. Añade productos al carrito\n3. Valida tu pedido\n4. Paga con Mobile Money\n5. Recibe tu confirmación por SMS\n\nPuedes seguir tu pedido en 'Mi Cuenta'.",
      article: "✍️ **Para publicar noticias:**\n\n1. Inicia sesión en tu cuenta\n2. Ve al Espacio de Autor\n3. Crea tu artículo con el editor\n4. Envía para revisión\n\nNuestro equipo revisará tu artículo en 48h.",
      contact: "📞 **Contáctanos:**\n\n- WhatsApp: +225 07 59 56 60 87\n- Email: contact@izy-scoly.ci\n- Horario: Lun-Vie 8am-6pm\n\n¡También estoy disponible 24/7 aquí!",
      premium: "⭐ **Artículos Premium:**\n\nAlgunos artículos de calidad son de pago. Una vez comprados, permanecen accesibles para siempre en tu cuenta.\n\nEl pago se realiza de forma segura a través de Mobile Money.",
      return: "↩️ **Política de devolución:**\n\nTienes 7 días después de la recepción para devolver un producto:\n- Sin usar\n- En embalaje original\n\nContacta al servicio al cliente para organizar la devolución.",
      greeting: "¡Hola! 👋 ¿Cómo puedo ayudarte hoy?",
      thanks: "¡Con mucho gusto! 😊 No dudes si tienes más preguntas.",
      goodbye: "¡Adiós! 👋 ¡Hasta pronto en Izy-scoly!",
      default: "No pude encontrar una respuesta precisa a tu pregunta. Esto es lo que puedo ofrecerte:\n\n- 📞 Contactar soporte: +225 07 59 56 60 87\n- 📧 Email: contact@izy-scoly.ci\n- ❓ Consultar nuestras FAQ\n\n¿Podrías reformular tu pregunta?",
      placeholder: "Escribe tu mensaje...",
      thinking: "ScIA está pensando...",
      poweredBy: "Impulsado por Izy-scoly • Respuestas instantáneas 24/7",
      needHelp: "¿Necesitas ayuda?",
      online: "Asistente Izy-scoly • En línea",
      endConversation: "Terminar",
      newConversation: "Nueva conversación",
      rateTitle: "¿Cómo calificas esta conversación?",
      rateThank: "¡Gracias por tu opinión!",
      quickDelivery: "Entrega",
      quickPayment: "Pago",
      quickOrder: "Pedir",
      quickContact: "Contacto",
    },
  };

  const currentTexts = texts[language] || texts.fr;

  const initialMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: currentTexts.welcome,
    timestamp: new Date(),
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, [isOpen, language]);

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
    
    // Keywords for each topic
    const deliveryKeywords = ['livraison', 'delivery', 'lieferung', 'entrega', 'expedier', 'ship', 'versand', 'envío'];
    const paymentKeywords = ['paiement', 'payment', 'zahlung', 'pago', 'argent', 'money', 'geld', 'dinero', 'mobile money', 'wave', 'orange', 'mtn', 'moov'];
    const orderKeywords = ['commande', 'order', 'bestellung', 'pedido', 'commander', 'acheter', 'buy', 'kaufen', 'comprar'];
    const articleKeywords = ['article', 'publier', 'publish', 'veröffentlichen', 'publicar', 'auteur', 'author', 'autor'];
    const contactKeywords = ['contact', 'kontakt', 'contacto', 'téléphone', 'phone', 'telefon', 'teléfono', 'email', 'whatsapp'];
    const premiumKeywords = ['premium', 'payant', 'paid', 'bezahlt', 'pago'];
    const returnKeywords = ['retour', 'return', 'rückgabe', 'devolución', 'rembourser', 'refund'];
    const greetingKeywords = ['bonjour', 'salut', 'hello', 'hi', 'hey', 'hallo', 'hola', 'coucou', 'bonsoir'];
    const thanksKeywords = ['merci', 'thanks', 'thank', 'danke', 'gracias', 'super', 'génial', 'parfait', 'great', 'awesome'];
    const goodbyeKeywords = ['au revoir', 'bye', 'goodbye', 'tschüss', 'adiós', 'à bientôt', 'adieu'];

    if (deliveryKeywords.some(k => lowerQuery.includes(k))) return currentTexts.delivery;
    if (paymentKeywords.some(k => lowerQuery.includes(k))) return currentTexts.payment;
    if (orderKeywords.some(k => lowerQuery.includes(k))) return currentTexts.order;
    if (articleKeywords.some(k => lowerQuery.includes(k))) return currentTexts.article;
    if (contactKeywords.some(k => lowerQuery.includes(k))) return currentTexts.contact;
    if (premiumKeywords.some(k => lowerQuery.includes(k))) return currentTexts.premium;
    if (returnKeywords.some(k => lowerQuery.includes(k))) return currentTexts.return;
    if (greetingKeywords.some(k => lowerQuery.includes(k))) return currentTexts.greeting;
    if (thanksKeywords.some(k => lowerQuery.includes(k))) return currentTexts.thanks;
    if (goodbyeKeywords.some(k => lowerQuery.includes(k))) return currentTexts.goodbye;

    return currentTexts.default;
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

    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));

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

  const handleEndConversation = () => {
    setShowRating(true);
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    setHasRated(true);
    setTimeout(() => {
      setShowRating(false);
      setHasRated(false);
      setRating(0);
      setMessages([]);
      setIsOpen(false);
    }, 2000);
  };

  const handleNewConversation = () => {
    setMessages([initialMessage]);
    setShowRating(false);
    setHasRated(false);
    setRating(0);
  };

  const renderMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
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
    { label: currentTexts.quickDelivery, query: "livraison" },
    { label: currentTexts.quickPayment, query: "paiement" },
    { label: currentTexts.quickOrder, query: "commande" },
    { label: currentTexts.quickContact, query: "contact" },
  ];

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 group"
            >
              <div className="relative">
                <Bot className="h-6 w-6 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
              </div>
            </Button>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap hidden sm:block"
            >
              <p className="text-sm font-medium">{currentTexts.needHelp} 💬</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              isExpanded 
                ? "inset-2 sm:inset-4 md:inset-8" 
                : "bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] h-[500px] sm:h-[550px] md:h-[600px] max-h-[85vh] sm:max-h-[80vh]"
            )}
          >
            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground">
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
                    <p className="text-xs text-primary-foreground/80">{currentTexts.online}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewConversation}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                    title={currentTexts.newConversation}
                  >
                    <RotateCcw size={16} />
                  </Button>
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
                    onClick={handleEndConversation}
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                    title={currentTexts.endConversation}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Rating Overlay */}
            {showRating && (
              <div className="absolute inset-0 bg-background/95 z-10 flex flex-col items-center justify-center p-6">
                {!hasRated ? (
                  <>
                    <Bot className="h-16 w-16 text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-4 text-center">{currentTexts.rateTitle}</h3>
                    <div className="flex gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className="p-2 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={cn(
                              "h-8 w-8",
                              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" size="sm" onClick={() => handleRating(5)}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {t.common.yes}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRating(2)}>
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        {t.common.no}
                      </Button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-8 w-8",
                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-lg font-medium text-primary">{currentTexts.rateThank}</p>
                  </motion.div>
                )}
              </div>
            )}

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
                        : "bg-primary/20"
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
                        {message.timestamp.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                        <span className="text-sm text-muted-foreground">{currentTexts.thinking}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick actions */}
            {messages.length <= 2 && !showRating && (
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
            {!showRating && (
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={currentTexts.placeholder}
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
                  {currentTexts.poweredBy}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScIA;
