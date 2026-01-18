import { useState, useEffect, useCallback } from "react";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Table, 
  Key, 
  Shield, 
  Clock, 
  FileJson, 
  FileText,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  X,
  Code,
  Zap,
  CloudUpload,
  Play,
  AlertCircle,
  FolderSync
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface TableInfo {
  name: string;
  rowCount: number;
  hasRLS: boolean;
  columns?: string[];
}

interface BackupHistory {
  id: string;
  created_at: string;
  type: string;
  tables: string[];
  size: string;
  status: string;
}

// List of all tables in the database
const ALL_TABLES = [
  'profiles', 'products', 'categories', 'orders', 'order_items', 
  'cart_items', 'user_roles', 'articles', 'article_comments', 
  'article_likes', 'article_purchases', 'advertisements', 'campaigns',
  'commissions', 'coupons', 'coupon_redemptions', 'email_logs', 
  'faq', 'notifications', 'payments', 'platform_settings', 
  'promotions', 'resources', 'reviews', 'vendor_settings', 'wishlist'
];

// Database roles
const DB_ROLES = [
  { name: 'admin', description: 'Accès complet à toutes les fonctionnalités', color: 'bg-red-500' },
  { name: 'moderator', description: 'Modération des contenus et commandes', color: 'bg-blue-500' },
  { name: 'vendor', description: 'Gestion des produits et ventes', color: 'bg-purple-500' },
  { name: 'delivery', description: 'Gestion des livraisons', color: 'bg-green-500' },
  { name: 'user', description: 'Utilisateur standard', color: 'bg-gray-500' },
];

// Database functions
const DB_FUNCTIONS = [
  { name: 'get_admin_stats', description: 'Statistiques administrateur', returns: 'TABLE' },
  { name: 'get_delivery_stats', description: 'Statistiques livreur', returns: 'TABLE' },
  { name: 'get_delivery_orders', description: 'Commandes livreur', returns: 'SETOF orders' },
  { name: 'validate_coupon', description: 'Validation coupon', returns: 'TABLE' },
  { name: 'has_role', description: 'Vérification rôle', returns: 'BOOLEAN' },
  { name: 'handle_new_user', description: 'Création profil auto', returns: 'TRIGGER' },
  { name: 'calculate_commission', description: 'Calcul commissions', returns: 'TRIGGER' },
  { name: 'notify_order_status_change', description: 'Notifications commande', returns: 'TRIGGER' },
  { name: 'notify_admin_new_order', description: 'Alerte nouvelle commande', returns: 'TRIGGER' },
  { name: 'update_updated_at_column', description: 'Mise à jour timestamp', returns: 'TRIGGER' },
];

const DatabaseManagement = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'sql'>('json');
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    fetchTableStats();
    
    // Auto-sync every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoSync) {
      interval = setInterval(fetchTableStats, 30000);
    }
    return () => clearInterval(interval);
  }, [autoSync]);

  const fetchTableStats = useCallback(async () => {
    setLoading(true);
    try {
      const tableStats: TableInfo[] = [];
      
      for (const tableName of ALL_TABLES) {
        try {
          const { count, error } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            tableStats.push({
              name: tableName,
              rowCount: count || 0,
              hasRLS: true
            });
          }
        } catch (e) {
          // Table might not be accessible
        }
      }
      
      setTables(tableStats);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error fetching table stats:', error);
      toast.error('Erreur lors du chargement des tables');
    }
    setLoading(false);
  }, []);

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAllTables = () => {
    setSelectedTables(tables.map(t => t.name));
  };

  const deselectAllTables = () => {
    setSelectedTables([]);
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast.error('Veuillez sélectionner au moins une table');
      return;
    }

    setExporting(true);
    try {
      const exportData: Record<string, any[]> = {};
      const metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tables: selectedTables,
        format: exportFormat
      };
      
      for (const tableName of selectedTables) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');
        
        if (!error && data) {
          exportData[tableName] = data;
        }
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify({ metadata, data: exportData }, null, 2);
          filename = `izy-scoly-backup-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          const csvParts: string[] = [];
          for (const [tableName, tableData] of Object.entries(exportData)) {
            if (tableData.length > 0) {
              const headers = Object.keys(tableData[0]).join(',');
              const rows = tableData.map(row => 
                Object.values(row).map(v => 
                  typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
                ).join(',')
              ).join('\n');
              csvParts.push(`--- TABLE: ${tableName} ---\n${headers}\n${rows}`);
            }
          }
          content = csvParts.join('\n\n');
          filename = `izy-scoly-backup-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'sql':
          const sqlParts: string[] = [];
          sqlParts.push(`-- IZY-SCOLY Database Backup`);
          sqlParts.push(`-- Generated: ${new Date().toISOString()}`);
          sqlParts.push(`-- Tables: ${selectedTables.join(', ')}\n`);
          
          for (const [tableName, tableData] of Object.entries(exportData)) {
            if (tableData.length > 0) {
              sqlParts.push(`\n-- Table: ${tableName}`);
              sqlParts.push(`DELETE FROM public.${tableName};`);
              
              const columns = Object.keys(tableData[0]);
              for (const row of tableData) {
                const values = columns.map(col => {
                  const val = row[col];
                  if (val === null) return 'NULL';
                  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                  return val;
                }).join(', ');
                sqlParts.push(`INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values});`);
              }
            }
          }
          content = sqlParts.join('\n');
          filename = `izy-scoly-backup-${new Date().toISOString().split('T')[0]}.sql`;
          mimeType = 'application/sql';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Export ${exportFormat.toUpperCase()} téléchargé avec succès`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
    setExporting(false);
  };

  const previewTableData = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(50);
      
      if (!error) {
        setPreviewData(data);
        setPreviewTable(tableName);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ ATTENTION: Cette opération va remplacer les données existantes. Êtes-vous sûr de vouloir continuer?')) {
      event.target.value = '';
      return;
    }

    setRestoring(true);
    setRestoreProgress(0);

    try {
      const text = await file.text();
      let data: any;

      try {
        const parsed = JSON.parse(text);
        data = parsed.data || parsed; // Support both formats
      } catch {
        toast.error('Format de fichier invalide. Utilisez un fichier JSON exporté.');
        setRestoring(false);
        event.target.value = '';
        return;
      }

      const tablesToRestore = Object.keys(data).filter((key) => ALL_TABLES.includes(key));
      if (tablesToRestore.length === 0) {
        toast.error('Aucune table reconnue dans le fichier.');
        setRestoring(false);
        event.target.value = '';
        return;
      }

      // Backend restore (service role) => remplace réellement les données côté cloud
      const { data: result, error } = await supabase.functions.invoke('restore-database', {
        body: { data, tables: tablesToRestore },
      });

      if (error || !result?.success) {
        console.error('Restore error:', error || result);
        toast.error('Erreur lors de la restauration');
        setRestoring(false);
        setRestoreProgress(0);
        event.target.value = '';
        return;
      }

      setRestoreProgress(100);
      toast.success(`Restauration terminée: ${result.imported}/${result.total} enregistrements restaurés`);
      fetchTableStats();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Erreur lors de la restauration');
    }

    setRestoring(false);
    setRestoreProgress(0);
    event.target.value = '';
  };

  if (loading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Gestion Base de Données</h1>
          <p className="text-muted-foreground">Export, import, visualisation et restauration des données</p>
          {lastSync && (
            <p className="text-xs text-muted-foreground mt-1">
              Dernière sync: {lastSync.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoSync} onCheckedChange={setAutoSync} id="auto-sync" />
            <Label htmlFor="auto-sync" className="text-sm">Sync auto</Label>
          </div>
          <Button onClick={fetchTableStats} variant="outline" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Tables</p>
                <p className="text-xl sm:text-2xl font-bold">{tables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                <Table className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Enregistrements</p>
                <p className="text-xl sm:text-2xl font-bold">{tables.reduce((a, t) => a + t.rowCount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">RLS Actif</p>
                <p className="text-xl sm:text-2xl font-bold">{tables.filter(t => t.hasRLS).length}/{tables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Sélectionnées</p>
                <p className="text-xl sm:text-2xl font-bold">{selectedTables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="tables">Tables & Données</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="restore">Restauration</TabsTrigger>
          <TabsTrigger value="schema">Schéma Complet</TabsTrigger>
          <TabsTrigger value="functions">Fonctions</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" size="sm" onClick={selectAllTables}>
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllTables}>
              Tout désélectionner
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedTables.length} table(s) sélectionnée(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <Card 
                key={table.name}
                className={`cursor-pointer transition-all ${
                  selectedTables.includes(table.name) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleTableSelection(table.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedTables.includes(table.name) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <Table size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{table.name}</p>
                        <p className="text-xs text-muted-foreground">{table.rowCount} lignes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {table.hasRLS && (
                        <Badge variant="outline" className="text-xs hidden sm:flex">
                          <Shield size={10} className="mr-1" />
                          RLS
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewTableData(table.name);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download size={20} />
                Exporter les données
              </CardTitle>
              <CardDescription>
                Téléchargez les données des tables sélectionnées dans le format de votre choix
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tables sélectionnées</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg max-h-40 overflow-y-auto">
                    {selectedTables.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune table sélectionnée</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedTables.map(t => (
                          <Badge key={t} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Format d'export</Label>
                  <Select value={exportFormat} onValueChange={(v: 'csv' | 'json' | 'sql') => setExportFormat(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson size={16} />
                          JSON (Recommandé pour restauration)
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          CSV (Excel, Sheets)
                        </div>
                      </SelectItem>
                      <SelectItem value="sql">
                        <div className="flex items-center gap-2">
                          <Database size={16} />
                          SQL (PostgreSQL, MySQL)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={exportData} 
                disabled={exporting || selectedTables.length === 0}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Télécharger {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restore Tab */}
        <TabsContent value="restore" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={20} />
                Restaurer la base de données
              </CardTitle>
              <CardDescription>
                Importez un fichier JSON de sauvegarde pour restaurer les données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {restoring ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium">Restauration en cours...</span>
                  </div>
                  <Progress value={restoreProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{restoreProgress}% terminé</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Sélectionnez un fichier de sauvegarde</p>
                  <p className="text-sm text-muted-foreground mb-4">Format supporté: JSON (exporté depuis ce module)</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden"
                    id="restore-file"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="restore-file" className="cursor-pointer">
                      <Upload size={18} />
                      Sélectionner un fichier
                    </label>
                  </Button>
                </div>
              )}

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">Avertissement Important</p>
                    <p className="text-sm text-destructive/80">
                      La restauration va <strong>remplacer toutes les données existantes</strong> par celles du fichier.
                      Assurez-vous d'avoir une sauvegarde avant de continuer.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Tab */}
        <TabsContent value="schema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code size={20} />
                Schéma de la base de données
              </CardTitle>
              <CardDescription>
                Vue complète de l'architecture et des relations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Schema Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <Key size={16} /> Utilisateurs & Auth
                    </h3>
                    <ul className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'profiles')?.rowCount || 0}</Badge>
                        profiles
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'user_roles')?.rowCount || 0}</Badge>
                        user_roles
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'vendor_settings')?.rowCount || 0}</Badge>
                        vendor_settings
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                      <HardDrive size={16} /> E-commerce
                    </h3>
                    <ul className="text-sm space-y-2 text-green-700 dark:text-green-300">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'products')?.rowCount || 0}</Badge>
                        products
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'categories')?.rowCount || 0}</Badge>
                        categories
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'orders')?.rowCount || 0}</Badge>
                        orders
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'order_items')?.rowCount || 0}</Badge>
                        order_items
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'cart_items')?.rowCount || 0}</Badge>
                        cart_items
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                      <FileText size={16} /> Contenu
                    </h3>
                    <ul className="text-sm space-y-2 text-purple-700 dark:text-purple-300">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'articles')?.rowCount || 0}</Badge>
                        articles
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'article_comments')?.rowCount || 0}</Badge>
                        article_comments
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'advertisements')?.rowCount || 0}</Badge>
                        advertisements
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'faq')?.rowCount || 0}</Badge>
                        faq
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                      <Zap size={16} /> Paiements
                    </h3>
                    <ul className="text-sm space-y-2 text-orange-700 dark:text-orange-300">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'payments')?.rowCount || 0}</Badge>
                        payments
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'commissions')?.rowCount || 0}</Badge>
                        commissions
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'coupons')?.rowCount || 0}</Badge>
                        coupons
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-900">
                    <h3 className="font-semibold text-pink-800 dark:text-pink-200 mb-3 flex items-center gap-2">
                      <FolderSync size={16} /> Marketing
                    </h3>
                    <ul className="text-sm space-y-2 text-pink-700 dark:text-pink-300">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'campaigns')?.rowCount || 0}</Badge>
                        campaigns
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'promotions')?.rowCount || 0}</Badge>
                        promotions
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'notifications')?.rowCount || 0}</Badge>
                        notifications
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Shield size={16} /> Système
                    </h3>
                    <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'platform_settings')?.rowCount || 0}</Badge>
                        platform_settings
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'email_logs')?.rowCount || 0}</Badge>
                        email_logs
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tables.find(t => t.name === 'reviews')?.rowCount || 0}</Badge>
                        reviews
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play size={20} />
                Fonctions PostgreSQL
              </CardTitle>
              <CardDescription>
                Fonctions et triggers disponibles dans la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DB_FUNCTIONS.map((fn) => (
                  <div key={fn.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Code size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">{fn.name}()</p>
                        <p className="text-xs text-muted-foreground">{fn.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{fn.returns}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key size={20} />
                Rôles Utilisateurs
              </CardTitle>
              <CardDescription>
                Niveaux d'accès et permissions dans l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DB_ROLES.map((role) => (
                  <div key={role.name} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
                    <div className={`w-3 h-3 rounded-full ${role.color}`} />
                    <div className="flex-1">
                      <p className="font-semibold capitalize">{role.name}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={!!previewTable} onOpenChange={() => { setPreviewTable(null); setPreviewData(null); }}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Table size={20} />
              {previewTable} ({previewData?.length || 0} enregistrements)
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[65vh]">
            {previewData && previewData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key} className="text-left p-2 font-medium text-muted-foreground whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="p-2 max-w-[200px] truncate" title={String(val ?? '')}>
                            {typeof val === 'object' ? JSON.stringify(val).slice(0, 50) : String(val ?? '-').slice(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucune donnée dans cette table</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseManagement;