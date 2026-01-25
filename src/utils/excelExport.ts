import * as XLSX from 'xlsx';

interface TableData {
  [tableName: string]: any[];
}

interface ExportOptions {
  includeMetadata?: boolean;
  includeSchema?: boolean;
  dateFormat?: string;
}

// Column display names for better readability
const COLUMN_LABELS: Record<string, Record<string, string>> = {
  profiles: {
    id: 'ID Utilisateur',
    email: 'Email',
    first_name: 'Prénom',
    last_name: 'Nom',
    phone: 'Téléphone',
    avatar_url: 'Photo',
    preferred_language: 'Langue',
    created_at: 'Date création',
    updated_at: 'Dernière modification',
  },
  products: {
    id: 'ID Produit',
    name_fr: 'Nom (FR)',
    name_en: 'Nom (EN)',
    price: 'Prix (FCFA)',
    original_price: 'Prix original',
    discount_percent: 'Réduction (%)',
    stock: 'Stock',
    is_active: 'Actif',
    is_featured: 'En vedette',
    category_id: 'ID Catégorie',
    vendor_id: 'ID Vendeur',
    created_at: 'Date création',
  },
  orders: {
    id: 'N° Commande',
    user_id: 'ID Client',
    status: 'Statut',
    total_amount: 'Montant total (FCFA)',
    discount_amount: 'Réduction (FCFA)',
    payment_method: 'Mode paiement',
    shipping_address: 'Adresse livraison',
    phone: 'Téléphone',
    delivery_user_id: 'ID Livreur',
    created_at: 'Date commande',
    updated_at: 'Dernière modification',
  },
  user_roles: {
    id: 'ID',
    user_id: 'ID Utilisateur',
    role: 'Rôle',
  },
  articles: {
    id: 'ID Article',
    title_fr: 'Titre (FR)',
    title_en: 'Titre (EN)',
    author_id: 'ID Auteur',
    category: 'Catégorie',
    status: 'Statut',
    views: 'Vues',
    likes: 'Likes',
    is_premium: 'Premium',
    price: 'Prix',
    created_at: 'Date création',
    published_at: 'Date publication',
  },
  categories: {
    id: 'ID',
    name_fr: 'Nom (FR)',
    name_en: 'Nom (EN)',
    slug: 'Slug',
    parent_id: 'ID Parent',
    created_at: 'Date création',
  },
  payments: {
    id: 'ID Paiement',
    order_id: 'N° Commande',
    user_id: 'ID Client',
    amount: 'Montant (FCFA)',
    payment_method: 'Mode paiement',
    status: 'Statut',
    transaction_id: 'ID Transaction',
    created_at: 'Date',
    completed_at: 'Date finalisation',
  },
  notifications: {
    id: 'ID',
    user_id: 'ID Utilisateur',
    type: 'Type',
    title: 'Titre',
    message: 'Message',
    is_read: 'Lu',
    created_at: 'Date',
  },
};

// Status translations
const STATUS_TRANSLATIONS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  published: 'Publié',
  draft: 'Brouillon',
  rejected: 'Rejeté',
  completed: 'Terminé',
  failed: 'Échoué',
  active: 'Actif',
  inactive: 'Inactif',
};

// Role translations  
const ROLE_TRANSLATIONS: Record<string, string> = {
  admin: 'Administrateur',
  moderator: 'Modérateur',
  vendor: 'Vendeur',
  delivery: 'Livreur',
  user: 'Utilisateur',
};

function formatValue(value: any, columnName: string): any {
  if (value === null || value === undefined) return '';
  
  // Boolean formatting
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }
  
  // Date formatting
  if (columnName.includes('_at') || columnName.includes('date')) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      return value;
    }
  }
  
  // Status translation
  if (columnName === 'status') {
    return STATUS_TRANSLATIONS[value] || value;
  }
  
  // Role translation
  if (columnName === 'role') {
    return ROLE_TRANSLATIONS[value] || value;
  }
  
  // JSON objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Currency formatting
  if (columnName.includes('amount') || columnName.includes('price') || columnName === 'total_sales') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toLocaleString('fr-FR') + ' FCFA';
    }
  }
  
  return value;
}

function getColumnLabel(tableName: string, columnName: string): string {
  return COLUMN_LABELS[tableName]?.[columnName] || columnName;
}

export function exportToExcel(
  data: TableData, 
  filename: string = 'export',
  options: ExportOptions = {}
): void {
  const workbook = XLSX.utils.book_new();
  
  // Create metadata sheet
  if (options.includeMetadata !== false) {
    const metadataRows = [
      ['═══════════════════════════════════════════════════'],
      ['IZY-SCOLY - Export Base de Données'],
      ['═══════════════════════════════════════════════════'],
      [''],
      ['Date d\'export:', new Date().toLocaleString('fr-FR')],
      ['Version:', '2.0'],
      ['Tables exportées:', Object.keys(data).length],
      ['Total enregistrements:', Object.values(data).reduce((a, t) => a + t.length, 0)],
      [''],
      ['═══════════════════════════════════════════════════'],
      ['Détail par table:'],
      ['═══════════════════════════════════════════════════'],
    ];
    
    Object.entries(data).forEach(([tableName, tableData]) => {
      metadataRows.push([tableName, `${tableData.length} enregistrements`]);
    });
    
    metadataRows.push(['']);
    metadataRows.push(['═══════════════════════════════════════════════════']);
    metadataRows.push(['Instructions:']);
    metadataRows.push(['- Chaque onglet contient les données d\'une table']);
    metadataRows.push(['- Les colonnes sont nommées de façon lisible']);
    metadataRows.push(['- Les dates sont au format FR']);
    metadataRows.push(['- Les statuts sont traduits en français']);
    metadataRows.push(['═══════════════════════════════════════════════════']);
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
    
    // Style metadata
    metadataSheet['!cols'] = [{ wch: 40 }, { wch: 30 }];
    
    XLSX.utils.book_append_sheet(workbook, metadataSheet, '📊 Résumé');
  }
  
  // Create sheet for each table
  Object.entries(data).forEach(([tableName, tableData]) => {
    if (!tableData || tableData.length === 0) {
      // Empty table - create sheet with message
      const emptySheet = XLSX.utils.aoa_to_sheet([
        [`Table: ${tableName}`],
        ['Aucune donnée'],
      ]);
      const safeSheetName = tableName.substring(0, 31).replace(/[\/\\\?\*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(workbook, emptySheet, safeSheetName);
      return;
    }
    
    // Get all columns from first row
    const columns = Object.keys(tableData[0]);
    
    // Create header row with friendly names
    const headerRow = columns.map(col => getColumnLabel(tableName, col));
    
    // Create data rows with formatted values
    const dataRows = tableData.map(row => 
      columns.map(col => formatValue(row[col], col))
    );
    
    // Combine header and data
    const sheetData = [headerRow, ...dataRows];
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Auto-fit column widths
    const colWidths = columns.map((col, i) => {
      const headerWidth = headerRow[i].length;
      const maxDataWidth = Math.max(
        ...dataRows.slice(0, 100).map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(Math.max(headerWidth, maxDataWidth, 10), 50) };
    });
    worksheet['!cols'] = colWidths;
    
    // Truncate sheet name to 31 chars (Excel limit) and remove invalid chars
    const safeSheetName = tableName.substring(0, 31).replace(/[\/\\\?\*\[\]]/g, '_');
    
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  });
  
  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTableToExcel(
  tableName: string,
  tableData: any[],
  filename?: string
): void {
  exportToExcel(
    { [tableName]: tableData },
    filename || `${tableName}-export`,
    { includeMetadata: false }
  );
}
