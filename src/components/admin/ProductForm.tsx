import { useState, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

interface ProductFormProps {
  product?: any;
  categories: any[];
  onSubmit: () => void;
  onCancel: () => void;
}

// Subjects by category type
const subjectsByCycle = {
  primary: [
    { value: "francais", label: "Français" },
    { value: "maths", label: "Mathématiques" },
    { value: "eveil", label: "Éveil" },
    { value: "dessin", label: "Dessin" },
    { value: "ecriture", label: "Écriture" },
  ],
  secondary: [
    { value: "francais", label: "Français" },
    { value: "maths", label: "Mathématiques" },
    { value: "physique", label: "Physique-Chimie" },
    { value: "svt", label: "SVT" },
    { value: "histoire-geo", label: "Histoire-Géographie" },
    { value: "anglais", label: "Anglais" },
    { value: "espagnol", label: "Espagnol" },
    { value: "allemand", label: "Allemand" },
    { value: "philosophie", label: "Philosophie" },
  ],
  university: [
    { value: "droit", label: "Droit" },
    { value: "economie", label: "Économie" },
    { value: "gestion", label: "Gestion" },
    { value: "informatique", label: "Informatique" },
    { value: "medecine", label: "Médecine" },
    { value: "sciences", label: "Sciences" },
    { value: "lettres", label: "Lettres" },
  ],
};

const ProductForm = ({ product, categories, onSubmit, onCancel }: ProductFormProps) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [formData, setFormData] = useState({
    name_fr: "",
    name_en: "",
    name_de: "",
    name_es: "",
    description_fr: "",
    description_en: "",
    description_de: "",
    description_es: "",
    price: "",
    original_price: "",
    discount_percent: "",
    stock: "",
    category_id: "",
    subject: "",
    image_url: "",
    is_active: true,
    is_featured: false,
    is_office_supply: false,
    // Office supply specific fields
    brand: "",
    model: "",
    color: "",
    material: "",
    dimensions: "",
  });

  const texts = {
    fr: {
      nameFr: "Nom (Français) *",
      nameEn: "Nom (Anglais)",
      nameDe: "Nom (Allemand)",
      nameEs: "Nom (Espagnol)",
      descriptionFr: "Description (Français)",
      price: "Prix (FCFA) *",
      originalPrice: "Prix original",
      discount: "Réduction (%)",
      stock: "Stock",
      category: "Catégorie",
      subject: "Matière",
      imageUrl: "URL de l'image",
      uploadImage: "Ou télécharger une image",
      active: "Actif",
      featured: "En vedette",
      save: "Enregistrer",
      cancel: "Annuler",
      autoTranslate: "Traduction auto",
      translating: "Traduction...",
      selectCategory: "Sélectionner une catégorie",
      selectSubject: "Sélectionner une matière",
      officeSupply: "Article bureautique",
      brand: "Marque",
      model: "Modèle",
      color: "Couleur",
      material: "Matériau",
      dimensions: "Dimensions",
    },
    en: {
      nameFr: "Name (French) *",
      nameEn: "Name (English)",
      nameDe: "Name (German)",
      nameEs: "Name (Spanish)",
      descriptionFr: "Description (French)",
      price: "Price (FCFA) *",
      originalPrice: "Original Price",
      discount: "Discount (%)",
      stock: "Stock",
      category: "Category",
      subject: "Subject",
      imageUrl: "Image URL",
      uploadImage: "Or upload an image",
      active: "Active",
      featured: "Featured",
      save: "Save",
      cancel: "Cancel",
      autoTranslate: "Auto translate",
      translating: "Translating...",
      selectCategory: "Select a category",
      selectSubject: "Select a subject",
      officeSupply: "Office supply",
      brand: "Brand",
      model: "Model",
      color: "Color",
      material: "Material",
      dimensions: "Dimensions",
    },
    de: {
      nameFr: "Name (Französisch) *",
      nameEn: "Name (Englisch)",
      nameDe: "Name (Deutsch)",
      nameEs: "Name (Spanisch)",
      descriptionFr: "Beschreibung (Französisch)",
      price: "Preis (FCFA) *",
      originalPrice: "Originalpreis",
      discount: "Rabatt (%)",
      stock: "Lager",
      category: "Kategorie",
      subject: "Fach",
      imageUrl: "Bild-URL",
      uploadImage: "Oder Bild hochladen",
      active: "Aktiv",
      featured: "Hervorgehoben",
      save: "Speichern",
      cancel: "Abbrechen",
      autoTranslate: "Auto-Übersetzen",
      translating: "Übersetzen...",
      selectCategory: "Kategorie auswählen",
      selectSubject: "Fach auswählen",
      officeSupply: "Bürobedarf",
      brand: "Marke",
      model: "Modell",
      color: "Farbe",
      material: "Material",
      dimensions: "Maße",
    },
    es: {
      nameFr: "Nombre (Francés) *",
      nameEn: "Nombre (Inglés)",
      nameDe: "Nombre (Alemán)",
      nameEs: "Nombre (Español)",
      descriptionFr: "Descripción (Francés)",
      price: "Precio (FCFA) *",
      originalPrice: "Precio original",
      discount: "Descuento (%)",
      stock: "Stock",
      category: "Categoría",
      subject: "Asignatura",
      imageUrl: "URL de imagen",
      uploadImage: "O subir una imagen",
      active: "Activo",
      featured: "Destacado",
      save: "Guardar",
      cancel: "Cancelar",
      autoTranslate: "Traducir auto",
      translating: "Traduciendo...",
      selectCategory: "Seleccionar categoría",
      selectSubject: "Seleccionar asignatura",
      officeSupply: "Suministro de oficina",
      brand: "Marca",
      model: "Modelo",
      color: "Color",
      material: "Material",
      dimensions: "Dimensiones",
    },
  };

  const t = texts[language] || texts.fr;

  useEffect(() => {
    if (product) {
      setFormData({
        name_fr: product.name_fr || "",
        name_en: product.name_en || "",
        name_de: product.name_de || "",
        name_es: product.name_es || "",
        description_fr: product.description_fr || "",
        description_en: product.description_en || "",
        description_de: product.description_de || "",
        description_es: product.description_es || "",
        price: product.price?.toString() || "",
        original_price: product.original_price?.toString() || "",
        discount_percent: product.discount_percent?.toString() || "",
        stock: product.stock?.toString() || "0",
        category_id: product.category_id || "",
        subject: "",
        image_url: product.image_url || "",
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        is_office_supply: false,
        brand: "",
        model: "",
        color: "",
        material: "",
        dimensions: "",
      });
      
      // Detect cycle from category
      const category = categories.find(c => c.id === product.category_id);
      if (category) {
        const slug = category.slug?.toLowerCase() || "";
        if (slug.includes("primaire") || slug.includes("primary")) {
          setSelectedCycle("primary");
        } else if (slug.includes("secondaire") || slug.includes("secondary") || slug.includes("college") || slug.includes("lycee")) {
          setSelectedCycle("secondary");
        } else if (slug.includes("universite") || slug.includes("university")) {
          setSelectedCycle("university");
        } else if (slug.includes("bureautique") || slug.includes("office")) {
          setFormData(prev => ({ ...prev, is_office_supply: true }));
        }
      }
    }
  }, [product, categories]);

  // Auto-calculate discount when prices change
  useEffect(() => {
    const price = parseFloat(formData.price) || 0;
    const originalPrice = parseFloat(formData.original_price) || 0;
    
    if (originalPrice > 0 && price > 0 && originalPrice > price) {
      const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      setFormData(prev => ({ ...prev, discount_percent: discount.toString() }));
    }
  }, [formData.price, formData.original_price]);

  // Detect if office supply based on category
  useEffect(() => {
    if (formData.category_id) {
      const category = categories.find(c => c.id === formData.category_id);
      if (category) {
        const slug = category.slug?.toLowerCase() || "";
        const isOffice = slug.includes("bureautique") || slug.includes("office");
        setFormData(prev => ({ ...prev, is_office_supply: isOffice }));
        
        if (!isOffice) {
          if (slug.includes("primaire") || slug.includes("primary")) {
            setSelectedCycle("primary");
          } else if (slug.includes("secondaire") || slug.includes("secondary") || slug.includes("college") || slug.includes("lycee")) {
            setSelectedCycle("secondary");
          } else if (slug.includes("universite") || slug.includes("university")) {
            setSelectedCycle("university");
          }
        }
      }
    }
  }, [formData.category_id, categories]);

  // Simple translation map for common school supplies
  const simpleTranslations: Record<string, Record<string, string>> = {
    fr: {
      "Cahier": "Notebook",
      "Stylo": "Pen",
      "Crayon": "Pencil",
      "Gomme": "Eraser",
      "Règle": "Ruler",
      "Calculatrice": "Calculator",
      "Livre": "Book",
      "Classeur": "Binder",
      "Trousse": "Pencil case",
    }
  };

  const autoTranslateName = async () => {
    if (!formData.name_fr) return;
    
    setTranslating(true);
    
    // Simple prefix translation
    const baseName = formData.name_fr;
    
    // For now, use simple suffix approach
    setFormData(prev => ({
      ...prev,
      name_en: baseName, // Keep same or add suffix
      name_de: baseName,
      name_es: baseName,
    }));
    
    setTranslating(false);
    toast.success("Noms traduits");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, use URL directly
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, image_url: reader.result as string }));
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    const productData = {
      name_fr: formData.name_fr,
      name_en: formData.name_en || formData.name_fr,
      name_de: formData.name_de || formData.name_fr,
      name_es: formData.name_es || formData.name_fr,
      description_fr: formData.description_fr,
      description_en: formData.description_en || formData.description_fr,
      description_de: formData.description_de || formData.description_fr,
      description_es: formData.description_es || formData.description_fr,
      price: parseFloat(formData.price) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : 0,
      stock: parseInt(formData.stock) || 0,
      category_id: formData.category_id || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
    };

    try {
      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        
        if (error) throw error;
        toast.success("Produit modifié avec succès");
      } else {
        const { error } = await supabase.from("products").insert(productData);
        
        if (error) throw error;
        toast.success("Produit ajouté avec succès");
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const subjects = selectedCycle ? subjectsByCycle[selectedCycle as keyof typeof subjectsByCycle] : [];

  return (
    <div className="grid gap-4 py-4">
      {/* Category first */}
      <div>
        <Label>{t.category}</Label>
        <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t.selectCategory} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name_fr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject field (only for school supplies) */}
      {!formData.is_office_supply && subjects.length > 0 && (
        <div>
          <Label>{t.subject}</Label>
          <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectSubject} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subj) => (
                <SelectItem key={subj.value} value={subj.value}>{subj.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Names with auto-translate */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>{t.nameFr}</Label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={autoTranslateName}
              disabled={translating || !formData.name_fr}
            >
              {translating ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {translating ? t.translating : t.autoTranslate}
            </Button>
          </div>
          <Input 
            value={formData.name_fr} 
            onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })} 
          />
        </div>
        <div>
          <Label>{t.nameEn}</Label>
          <Input 
            value={formData.name_en} 
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} 
          />
        </div>
        <div>
          <Label>{t.nameDe}</Label>
          <Input 
            value={formData.name_de} 
            onChange={(e) => setFormData({ ...formData, name_de: e.target.value })} 
          />
        </div>
        <div>
          <Label>{t.nameEs}</Label>
          <Input 
            value={formData.name_es} 
            onChange={(e) => setFormData({ ...formData, name_es: e.target.value })} 
          />
        </div>
      </div>
      
      <div>
        <Label>{t.descriptionFr}</Label>
        <Textarea 
          value={formData.description_fr} 
          onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })} 
        />
      </div>

      {/* Office supply specific fields */}
      {formData.is_office_supply && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label>{t.brand}</Label>
            <Input 
              value={formData.brand} 
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: BIC, Staedtler..."
            />
          </div>
          <div>
            <Label>{t.model}</Label>
            <Input 
              value={formData.model} 
              onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
            />
          </div>
          <div>
            <Label>{t.color}</Label>
            <Input 
              value={formData.color} 
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Ex: Bleu, Rouge..."
            />
          </div>
          <div>
            <Label>{t.material}</Label>
            <Input 
              value={formData.material} 
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="Ex: Plastique, Métal..."
            />
          </div>
          <div className="col-span-2">
            <Label>{t.dimensions}</Label>
            <Input 
              value={formData.dimensions} 
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              placeholder="Ex: 21x29.7cm, A4..."
            />
          </div>
        </div>
      )}

      {/* Prices with auto-calculate discount */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t.price}</Label>
          <Input 
            type="number" 
            value={formData.price} 
            onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
          />
        </div>
        <div>
          <Label>{t.originalPrice}</Label>
          <Input 
            type="number" 
            value={formData.original_price} 
            onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} 
          />
        </div>
        <div>
          <Label>{t.discount}</Label>
          <Input 
            type="number" 
            value={formData.discount_percent} 
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.stock}</Label>
          <Input 
            type="number" 
            value={formData.stock} 
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })} 
          />
        </div>
      </div>

      {/* Image URL or Upload */}
      <div className="space-y-3">
        <div>
          <Label>{t.imageUrl}</Label>
          <Input 
            value={formData.image_url} 
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{t.uploadImage}</span>
          <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="text-sm">Upload</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {formData.image_url && (
          <div className="relative w-24 h-24">
            <img 
              src={formData.image_url} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-lg"
            />
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, image_url: "" })}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_active} 
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} 
          />
          <Label>{t.active}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_featured} 
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} 
          />
          <Label>{t.featured}</Label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          {t.save}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
