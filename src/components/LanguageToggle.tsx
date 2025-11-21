import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
      className="flex-1 md:flex-none text-sm md:text-base bg-door-available text-white border-2 border-door-available shadow-lg hover:shadow-xl hover:bg-door-available rounded-lg md:rounded-2xl transition-all duration-300"
    >
      <Languages className="w-4 h-4 mr-2" />
      {language === 'de' ? 'EN' : 'DE'}
    </Button>
  );
};

export default LanguageToggle;
