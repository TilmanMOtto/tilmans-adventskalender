import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
      variant="outline"
      size="sm"
      className="bg-background/80 backdrop-blur-md border-2 shadow-lg hover:shadow-xl"
    >
      <Languages className="w-4 h-4 mr-2" />
      {language === 'de' ? 'EN' : 'DE'}
    </Button>
  );
};

export default LanguageToggle;
