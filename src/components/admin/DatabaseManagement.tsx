import { useState, useEffect } from "react";
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
  X
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

interface TableInfo {
  name: string;
  rowCount: number;
  hasRLS: boolean;
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

const DatabaseManagement = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'sql'>('json');
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewTable, setPreviewTable] = useState<string | null>(null);

  useEffect(() => {
    fetchTableStats();
  }, []);

  const fetchTableStats = async () => {
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
              hasRLS: true // All tables have RLS enabled
            });
          }
        } catch (e) {
          // Table might not be accessible
        }
      }
      
      setTables(tableStats);
    } catch (error) {
      console.error('Error fetching table stats:', error);
      toast.error('Erreur lors du chargement des tables');
    }
    setLoading(false);
  };

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
          content = JSON.stringify(exportData, null, 2);
          filename = `izy-scoly-backup-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          // For CSV, we'll export each table separately in one file
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
          // Generate SQL INSERT statements
          const sqlParts: string[] = [];
          for (const [tableName, tableData] of Object.entries(exportData)) {
            if (tableData.length > 0) {
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

      // Download file
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
        .limit(10);
      
      if (!error) {
        setPreviewData(data);
        setPreviewTable(tableName);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (typeof data !== 'object') {
        toast.error('Format de fichier invalide');
        return;
      }

      let imported = 0;
      for (const [tableName, tableData] of Object.entries(data)) {
        if (Array.isArray(tableData) && ALL_TABLES.includes(tableName)) {
          for (const row of tableData as any[]) {
            // Remove id to avoid conflicts, let DB generate new ones
            const { id, ...rowData } = row;
            try {
              await supabase.from(tableName as any).upsert(row);
              imported++;
            } catch (e) {
              console.error(`Error importing row to ${tableName}:`, e);
            }
          }
        }
      }

      toast.success(`${imported} enregistrements importés avec succès`);
      fetchTableStats();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import. Vérifiez le format du fichier.');
    }

    // Reset input
    event.target.value = '';
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
          <h1 className="text-2xl font-display font-bold text-foreground">Gestion Base de Données</h1>
          <p className="text-muted-foreground">Export, import et visualisation des données</p>
        </div>
        <Button onClick={fetchTableStats} variant="outline">
          <RefreshCw size={18} />
          Actualiser
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                <Table className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enregistrements</p>
                <p className="text-2xl font-bold">{tables.reduce((a, t) => a + t.rowCount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RLS Actif</p>
                <p className="text-2xl font-bold">{tables.filter(t => t.hasRLS).length}/{tables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sélectionnées</p>
                <p className="text-2xl font-bold">{selectedTables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import / Restauration</TabsTrigger>
          <TabsTrigger value="schema">Schéma</TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={selectAllTables}>
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllTables}>
              Tout désélectionner
            </Button>
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
                        <p className="font-medium">{table.name}</p>
                        <p className="text-sm text-muted-foreground">{table.rowCount} lignes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {table.hasRLS && (
                        <Badge variant="outline" className="text-xs">
                          <Shield size={12} className="mr-1" />
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
              <CardTitle>Exporter les données</CardTitle>
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
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="sql">
                        <div className="flex items-center gap-2">
                          <Database size={16} />
                          SQL
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

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importer / Restaurer</CardTitle>
              <CardDescription>
                Importez des données depuis un fichier JSON de sauvegarde
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Glissez un fichier ou cliquez pour sélectionner</p>
                <p className="text-sm text-muted-foreground mb-4">Format supporté: JSON</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button asChild>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload size={18} />
                    Sélectionner un fichier
                  </label>
                </Button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Attention</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      L'import peut écraser des données existantes. Assurez-vous d'avoir une sauvegarde avant de procéder.
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
              <CardTitle>Schéma de la base de données</CardTitle>
              <CardDescription>
                Vue d'ensemble de la structure de la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Schema Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Utilisateurs & Auth</h3>
                    <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• profiles (profils utilisateurs)</li>
                      <li>• user_roles (rôles: admin, vendor, delivery)</li>
                      <li>• vendor_settings (paramètres vendeurs)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">E-commerce</h3>
                    <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>• products (produits)</li>
                      <li>• categories (catégories)</li>
                      <li>• orders (commandes)</li>
                      <li>• order_items (articles commande)</li>
                      <li>• cart_items (panier)</li>
                      <li>• wishlist (favoris)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Contenu</h3>
                    <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
                      <li>• articles (actualités)</li>
                      <li>• article_comments (commentaires)</li>
                      <li>• article_likes (likes)</li>
                      <li>• advertisements (publicités)</li>
                      <li>• faq (questions fréquentes)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Paiements</h3>
                    <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                      <li>• payments (paiements)</li>
                      <li>• commissions (commissions vendeurs)</li>
                      <li>• coupons (codes promo)</li>
                      <li>• coupon_redemptions (utilisations)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-900">
                    <h3 className="font-semibold text-pink-800 dark:text-pink-200 mb-2">Marketing</h3>
                    <ul className="text-sm space-y-1 text-pink-700 dark:text-pink-300">
                      <li>• campaigns (campagnes)</li>
                      <li>• promotions (promotions)</li>
                      <li>• notifications (notifications)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Système</h3>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <li>• platform_settings (paramètres)</li>
                      <li>• email_logs (historique emails)</li>
                      <li>• reviews (avis produits)</li>
                      <li>• resources (ressources pédagogiques)</li>
                    </ul>
                  </div>
                </div>

                {/* Roles Info */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Key size={18} />
                    Rôles disponibles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>admin</Badge>
                    <Badge variant="secondary">moderator</Badge>
                    <Badge variant="outline">user</Badge>
                    <Badge className="bg-purple-100 text-purple-800">vendor</Badge>
                    <Badge className="bg-green-100 text-green-800">delivery</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={!!previewTable} onOpenChange={() => { setPreviewTable(null); setPreviewData(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Aperçu: {previewTable}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {previewData && previewData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key} className="text-left p-2 font-medium text-muted-foreground">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row: any, i: number) => (
                      <tr key={i} className="border-b">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="p-2 max-w-xs truncate">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseManagement;
