import { useState, useEffect } from "react";
import { Search, Download, FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Resource {
  id: string;
  title_fr: string;
  title_en: string;
  title_de: string;
  title_es: string;
  description_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_es: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  subject: string | null;
  grade_level: string | null;
  is_free: boolean;
  price: number;
  downloads: number;
}

const domains = [
  { id: 'science', name_fr: 'Sciences', name_en: 'Sciences', name_de: 'Wissenschaften', name_es: 'Ciencias' },
  { id: 'law', name_fr: 'Droit', name_en: 'Law', name_de: 'Recht', name_es: 'Derecho' },
  { id: 'economics', name_fr: 'Économie', name_en: 'Economics', name_de: 'Wirtschaft', name_es: 'Economía' },
  { id: 'medicine', name_fr: 'Médecine', name_en: 'Medicine', name_de: 'Medizin', name_es: 'Medicina' },
  { id: 'engineering', name_fr: 'Ingénierie', name_en: 'Engineering', name_de: 'Ingenieurwesen', name_es: 'Ingeniería' },
  { id: 'literature', name_fr: 'Lettres', name_en: 'Literature', name_de: 'Literatur', name_es: 'Literatura' },
  { id: 'arts', name_fr: 'Arts', name_en: 'Arts', name_de: 'Kunst', name_es: 'Artes' },
  { id: 'social', name_fr: 'Sciences Sociales', name_en: 'Social Sciences', name_de: 'Sozialwissenschaften', name_es: 'Ciencias Sociales' },
];

const documentTypes = [
  { id: 'lecture', name_fr: 'Cours magistraux', name_en: 'Lectures', name_de: 'Vorlesungen', name_es: 'Conferencias' },
  { id: 'td', name_fr: 'Travaux dirigés', name_en: 'Tutorials', name_de: 'Übungen', name_es: 'Tutorías' },
  { id: 'thesis', name_fr: 'Mémoires & Thèses', name_en: 'Theses', name_de: 'Abschlussarbeiten', name_es: 'Tesis' },
  { id: 'article', name_fr: 'Articles', name_en: 'Articles', name_de: 'Artikel', name_es: 'Artículos' },
];

const University = () => {
  const { language, t } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('category', 'university')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedTitle = (resource: Resource) => {
    switch (language) {
      case 'en': return resource.title_en;
      case 'de': return resource.title_de;
      case 'es': return resource.title_es;
      default: return resource.title_fr;
    }
  };

  const getLocalizedDescription = (resource: Resource) => {
    switch (language) {
      case 'en': return resource.description_en;
      case 'de': return resource.description_de;
      case 'es': return resource.description_es;
      default: return resource.description_fr;
    }
  };

  const getLocalizedName = (item: typeof domains[0] | typeof documentTypes[0]) => {
    switch (language) {
      case 'en': return item.name_en;
      case 'de': return item.name_de;
      case 'es': return item.name_es;
      default: return item.name_fr;
    }
  };

  const filteredResources = resources.filter(resource => {
    const title = getLocalizedTitle(resource).toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    const matchesDomain = !selectedDomain || resource.subject === selectedDomain;
    const matchesType = !selectedType || resource.grade_level === selectedType;
    return matchesSearch && matchesDomain && matchesType;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + t.common.currency;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center text-secondary-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-foreground/10 backdrop-blur-sm border border-secondary-foreground/20 mb-6">
              <GraduationCap size={18} />
              <span className="text-sm font-medium">Scoly Université</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              {t.spaces.university.title}
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t.spaces.university.description}
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Resources */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 space-y-6">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder={t.resources.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Domains */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t.resources.subjects}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDomain(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedDomain ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {t.resources.allSubjects}
                  </button>
                  {domains.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => setSelectedDomain(domain.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedDomain === domain.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {getLocalizedName(domain)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Types */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t.resources.levels}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedType ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {t.resources.allLevels}
                  </button>
                  {documentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedType === type.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {getLocalizedName(type)}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Resources Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                      <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t.resources.noResults}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="group bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-secondary/10">
                          <FileText size={24} className="text-secondary" />
                        </div>
                        <Badge variant={resource.is_free ? "secondary" : "default"}>
                          {resource.is_free ? t.resources.free : formatPrice(resource.price)}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {getLocalizedTitle(resource)}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {getLocalizedDescription(resource)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {resource.file_type && (
                          <span className="uppercase">{resource.file_type}</span>
                        )}
                        {resource.file_size && (
                          <span>{formatFileSize(resource.file_size)}</span>
                        )}
                        <span>{resource.downloads} {t.resources.downloads}</span>
                      </div>

                      <Button variant="default" size="sm" className="w-full bg-secondary hover:bg-secondary/90">
                        <Download size={16} />
                        {t.resources.download}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default University;
