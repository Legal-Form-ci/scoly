import { useState, useEffect } from "react";
import { Search, Download, FileText, BookOpen } from "lucide-react";
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

const subjects = [
  { id: 'math', name_fr: 'Mathématiques', name_en: 'Mathematics', name_de: 'Mathematik', name_es: 'Matemáticas' },
  { id: 'french', name_fr: 'Français', name_en: 'French', name_de: 'Französisch', name_es: 'Francés' },
  { id: 'english', name_fr: 'Anglais', name_en: 'English', name_de: 'Englisch', name_es: 'Inglés' },
  { id: 'physics', name_fr: 'Physique', name_en: 'Physics', name_de: 'Physik', name_es: 'Física' },
  { id: 'chemistry', name_fr: 'Chimie', name_en: 'Chemistry', name_de: 'Chemie', name_es: 'Química' },
  { id: 'biology', name_fr: 'SVT', name_en: 'Biology', name_de: 'Biologie', name_es: 'Biología' },
  { id: 'history', name_fr: 'Histoire-Géo', name_en: 'History-Geography', name_de: 'Geschichte-Geographie', name_es: 'Historia-Geografía' },
  { id: 'philosophy', name_fr: 'Philosophie', name_en: 'Philosophy', name_de: 'Philosophie', name_es: 'Filosofía' },
];

const levels = [
  { id: '6eme', name: '6ème' },
  { id: '5eme', name: '5ème' },
  { id: '4eme', name: '4ème' },
  { id: '3eme', name: '3ème' },
  { id: '2nde', name: '2nde' },
  { id: '1ere', name: '1ère' },
  { id: 'tle', name: 'Terminale' },
];

const Secondary = () => {
  const { language, t } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('category', 'secondary')
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

  const getLocalizedSubject = (subject: typeof subjects[0]) => {
    switch (language) {
      case 'en': return subject.name_en;
      case 'de': return subject.name_de;
      case 'es': return subject.name_es;
      default: return subject.name_fr;
    }
  };

  const filteredResources = resources.filter(resource => {
    const title = getLocalizedTitle(resource).toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || resource.subject === selectedSubject;
    const matchesLevel = !selectedLevel || resource.grade_level === selectedLevel;
    return matchesSearch && matchesSubject && matchesLevel;
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
      <section className="pt-24 pb-12 bg-gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-6">
              <BookOpen size={18} />
              <span className="text-sm font-medium">Scoly Secondaire</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              {t.spaces.secondary.title}
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t.spaces.secondary.description}
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

              {/* Subjects */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t.resources.subjects}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedSubject ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {t.resources.allSubjects}
                  </button>
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedSubject === subject.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {getLocalizedSubject(subject)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Levels */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t.resources.levels}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedLevel(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedLevel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {t.resources.allLevels}
                  </button>
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedLevel === level.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {level.name}
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
                        <div className="p-3 rounded-xl bg-primary/10">
                          <FileText size={24} className="text-primary" />
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

                      <Button variant="hero" size="sm" className="w-full">
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

export default Secondary;
