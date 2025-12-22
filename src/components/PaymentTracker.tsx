import { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle, Loader2, RefreshCw, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePayment, PaymentStatus, PaymentMethod } from "@/hooks/usePayment";
import { cn } from "@/lib/utils";

interface PaymentTrackerProps {
  paymentId?: string;
  orderId?: string;
  onPaymentComplete?: () => void;
  onPaymentFailed?: () => void;
}

const paymentMethodNames: Record<PaymentMethod, string> = {
  orange: "Orange Money",
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  wave: "Wave"
};

const paymentMethodColors: Record<PaymentMethod, string> = {
  orange: "bg-orange-500",
  mtn: "bg-yellow-400",
  moov: "bg-blue-500",
  wave: "bg-cyan-500"
};

const statusConfig: Record<PaymentStatus, { icon: React.ReactNode; label: string; color: string }> = {
  pending: {
    icon: <Clock className="h-6 w-6" />,
    label: "En attente de confirmation",
    color: "text-yellow-500"
  },
  processing: {
    icon: <Loader2 className="h-6 w-6 animate-spin" />,
    label: "Traitement en cours",
    color: "text-blue-500"
  },
  completed: {
    icon: <CheckCircle className="h-6 w-6" />,
    label: "Paiement confirmé",
    color: "text-green-500"
  },
  failed: {
    icon: <XCircle className="h-6 w-6" />,
    label: "Paiement échoué",
    color: "text-red-500"
  },
  cancelled: {
    icon: <XCircle className="h-6 w-6" />,
    label: "Paiement annulé",
    color: "text-muted-foreground"
  }
};

export const PaymentTracker = ({
  paymentId,
  orderId,
  onPaymentComplete,
  onPaymentFailed
}: PaymentTrackerProps) => {
  const { t } = useLanguage();
  const { checkPaymentStatus, paymentStatus } = usePayment();
  const [payment, setPayment] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);

  const fetchStatus = async () => {
    setChecking(true);
    const result = await checkPaymentStatus(paymentId, orderId);
    if (result) {
      setPayment(result);
      if (result.status === 'completed') {
        setAutoCheck(false);
        onPaymentComplete?.();
      } else if (result.status === 'failed' || result.status === 'cancelled') {
        setAutoCheck(false);
        onPaymentFailed?.();
      }
    }
    setChecking(false);
  };

  useEffect(() => {
    if (paymentId || orderId) {
      fetchStatus();
    }
  }, [paymentId, orderId]);

  // Auto-check every 5 seconds for pending payments
  useEffect(() => {
    if (!autoCheck || !payment || payment.status === 'completed' || payment.status === 'failed') {
      return;
    }

    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [autoCheck, payment]);

  if (!payment) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const status = statusConfig[payment.status as PaymentStatus] || statusConfig.pending;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="text-center mb-6">
        <div className={cn(
          "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
          payment.status === 'completed' ? "bg-green-500/10" :
          payment.status === 'failed' ? "bg-red-500/10" :
          "bg-primary/10"
        )}>
          <span className={status.color}>{status.icon}</span>
        </div>
        <h3 className="text-xl font-bold text-foreground">{status.label}</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-muted-foreground">Mode de paiement</span>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded",
              paymentMethodColors[payment.paymentMethod as PaymentMethod]
            )} />
            <span className="font-medium">
              {paymentMethodNames[payment.paymentMethod as PaymentMethod]}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-muted-foreground">Montant</span>
          <span className="font-bold text-primary">
            {payment.amount?.toLocaleString()} {t.common.currency}
          </span>
        </div>

        {payment.transactionId && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-sm">{payment.transactionId.slice(0, 20)}...</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-muted-foreground">Date</span>
          <span className="text-sm">
            {new Date(payment.createdAt).toLocaleString('fr-FR')}
          </span>
        </div>
      </div>

      {(payment.status === 'pending' || payment.status === 'processing') && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Phone className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground">
              Veuillez confirmer le paiement sur votre téléphone mobile
            </p>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={fetchStatus}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Vérifier le statut
          </Button>
        </div>
      )}

      {payment.status === 'completed' && payment.completedAt && (
        <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-sm text-green-600 text-center">
            Paiement confirmé le {new Date(payment.completedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      )}

      {payment.status === 'failed' && (
        <div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-sm text-red-600 text-center">
            Le paiement a échoué. Veuillez réessayer.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentTracker;
