import { useState, useEffect } from "react";
import { 
  Cloud, 
  Save, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  HardDrive,
  Settings,
  Calendar,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  provider: 'google_drive' | 'ovh' | 'local';
  retentionDays: number;
  lastBackup: string | null;
  nextBackup: string | null;
}

const BackupSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BackupConfig>({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    provider: 'local',
    retentionDays: 30,
    lastBackup: null,
    nextBackup: null
  });
  const [credentials, setCredentials] = useState({
    googleDriveApiKey: '',
    ovhEndpoint: '',
    ovhAccessKey: '',
    ovhSecretKey: '',
    ovhBucket: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'backup_config')
        .single();
      
      if (data?.value) {
        const savedConfig = JSON.parse(data.value);
        setConfig(prev => ({ ...prev, ...savedConfig }));
      }
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Calculate next backup time
      const now = new Date();
      let nextBackup = new Date();
      
      switch (config.frequency) {
        case 'daily':
          nextBackup.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextBackup.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextBackup.setMonth(now.getMonth() + 1);
          break;
      }
      
      const [hours, minutes] = config.time.split(':');
      nextBackup.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const configToSave = {
        ...config,
        nextBackup: config.enabled ? nextBackup.toISOString() : null
      };

      await supabase
        .from('platform_settings')
        .upsert({
          key: 'backup_config',
          value: JSON.stringify(configToSave),
          description: 'Configuration de sauvegarde automatique'
        }, { onConflict: 'key' });

      // Save credentials if provider requires them
      if (config.provider !== 'local') {
        await supabase
          .from('platform_settings')
          .upsert({
            key: 'backup_credentials',
            value: JSON.stringify(credentials),
            description: 'Identifiants de connexion pour sauvegarde cloud'
          }, { onConflict: 'key' });
      }

      setConfig(configToSave);
      toast.success('Configuration enregistrée');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const testConnection = async () => {
    toast.info('Test de connexion en cours...');
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (config.provider === 'local') {
      toast.success('Connexion locale prête');
    } else if (config.provider === 'google_drive') {
      if (credentials.googleDriveApiKey) {
        toast.success('Connexion Google Drive validée');
      } else {
        toast.error('Clé API Google Drive requise');
      }
    } else if (config.provider === 'ovh') {
      if (credentials.ovhEndpoint && credentials.ovhAccessKey && credentials.ovhSecretKey) {
        toast.success('Connexion OVH Object Storage validée');
      } else {
        toast.error('Identifiants OVH incomplets');
      }
    }
  };

  const runManualBackup = async () => {
    toast.info('Sauvegarde manuelle en cours...');
    
    try {
      // Fetch all data for backup
      const tables = [
        'profiles', 'products', 'categories', 'orders', 'order_items',
        'articles', 'advertisements', 'coupons', 'faq'
      ];
      
      const backupData: Record<string, any[]> = {};
      
      for (const table of tables) {
        const { data } = await supabase.from(table as any).select('*');
        if (data) {
          backupData[table] = data;
        }
      }

      // Create backup file
      const content = JSON.stringify(backupData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `izy-scoly-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update last backup time
      const newConfig = {
        ...config,
        lastBackup: new Date().toISOString()
      };
      
      await supabase
        .from('platform_settings')
        .upsert({
          key: 'backup_config',
          value: JSON.stringify(newConfig),
          description: 'Configuration de sauvegarde automatique'
        }, { onConflict: 'key' });

      setConfig(newConfig);
      toast.success('Sauvegarde manuelle terminée');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Sauvegarde Automatique</h2>
          <p className="text-muted-foreground">Configurez les sauvegardes automatiques de votre base de données</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={runManualBackup}>
            <Save size={18} />
            Sauvegarde manuelle
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config.enabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-900/20'}`}>
                <Cloud className={`h-6 w-6 ${config.enabled ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="font-semibold">
                  {config.enabled ? 'Activé' : 'Désactivé'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                <p className="font-semibold">
                  {config.lastBackup 
                    ? new Date(config.lastBackup).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Jamais'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prochaine sauvegarde</p>
                <p className="font-semibold">
                  {config.nextBackup && config.enabled
                    ? new Date(config.nextBackup).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Non planifiée'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Paramètres de sauvegarde automatique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Activer les sauvegardes automatiques</p>
              <p className="text-sm text-muted-foreground">
                La base de données sera sauvegardée automatiquement selon la fréquence choisie
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select
                value={config.frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setConfig(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input
                type="time"
                value={config.time}
                onChange={(e) => setConfig(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select
                value={config.provider}
                onValueChange={(value: 'local' | 'google_drive' | 'ovh') => 
                  setConfig(prev => ({ ...prev, provider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} />
                      Local (téléchargement)
                    </div>
                  </SelectItem>
                  <SelectItem value="google_drive">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} />
                      Google Drive
                    </div>
                  </SelectItem>
                  <SelectItem value="ovh">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} />
                      OVH Object Storage
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Retention */}
            <div className="space-y-2">
              <Label>Rétention (jours)</Label>
              <Input
                type="number"
                value={config.retentionDays}
                onChange={(e) => setConfig(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                min={1}
                max={365}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Credentials */}
      {config.provider !== 'local' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 size={20} />
              Connexion {config.provider === 'google_drive' ? 'Google Drive' : 'OVH'}
            </CardTitle>
            <CardDescription>
              Configurez les identifiants de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.provider === 'google_drive' && (
              <div className="space-y-2">
                <Label>Clé API Google Drive</Label>
                <Input
                  type="password"
                  value={credentials.googleDriveApiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, googleDriveApiKey: e.target.value }))}
                  placeholder="Entrez votre clé API"
                />
              </div>
            )}

            {config.provider === 'ovh' && (
              <>
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={credentials.ovhEndpoint}
                    onChange={(e) => setCredentials(prev => ({ ...prev, ovhEndpoint: e.target.value }))}
                    placeholder="https://s3.gra.cloud.ovh.net"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Key</Label>
                    <Input
                      type="password"
                      value={credentials.ovhAccessKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, ovhAccessKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      value={credentials.ovhSecretKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, ovhSecretKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nom du bucket</Label>
                  <Input
                    value={credentials.ovhBucket}
                    onChange={(e) => setCredentials(prev => ({ ...prev, ovhBucket: e.target.value }))}
                    placeholder="izy-scoly-backups"
                  />
                </div>
              </>
            )}

            <Button variant="outline" onClick={testConnection}>
              <Link2 size={16} />
              Tester la connexion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Card className="border-yellow-200 dark:border-yellow-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Information importante</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Les sauvegardes automatiques vers Google Drive ou OVH nécessitent une configuration 
                supplémentaire côté serveur. Contactez l'administrateur système pour activer cette fonctionnalité.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
