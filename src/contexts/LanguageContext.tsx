import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  de: {
    'calendar.title': "Tilman's Adventskalender",
    'calendar.welcome': 'Willkommen',
    'calendar.admin': 'Du bist Admin',
    'calendar.adminPanel': 'Admin Panel',
    'calendar.logout': 'Logout',
    'door.loading': 'Lädt...',
    'door.close': 'Schließen',
    'door.likes': 'Gefällt mir',
    'door.likeStory': 'Gefällt mir',
    'door.unlikeStory': 'Gefällt mir nicht mehr',
    'door.yourMessage': 'Deine Nachricht an mich (Tilman)',
    'door.writeMessage': 'Schreib mir (Tilman) eine Nachricht...',
    'door.send': 'Senden',
    'door.delete': 'Löschen',
    'door.noMessages': 'Du hast mir noch keine Nachricht hinterlassen',
    'admin.panelTitle': 'Admin Panel',
    'admin.contentManagement': 'Inhaltsverwaltung',
    'admin.userProgress': 'Benutzerfortschritt',
    'admin.reactions': 'Reaktionen',
    'admin.overview': 'Übersicht',
    'admin.comments': 'Kommentare',
    'admin.latestComments': 'Neueste Kommentare',
    'admin.likesPerDoor': 'Likes pro Tür',
    'admin.door': 'Tür',
    'admin.dayNumber': 'Tag Nummer',
    'admin.entryTitle': 'Titel',
    'admin.titleEnglish': 'Titel (Englisch)',
    'admin.story': 'Geschichte',
    'admin.storyEnglish': 'Geschichte (Englisch)',
    'admin.images': 'Bilder/Videos',
    'admin.audio': 'Audio (Optional)',
    'admin.save': 'Speichern',
    'admin.update': 'Aktualisieren',
    'admin.cancel': 'Abbrechen',
    'admin.uploading': 'Wird hochgeladen...',
    'admin.translate': 'Ins Englische übersetzen',
    'admin.translating': 'Wird übersetzt...',
    'auth.login': 'Anmelden',
    'auth.signup': 'Registrieren',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.username': 'Benutzername',
    'landing.title': "Tilman's Adventskalender",
    'landing.subtitle': 'Entdecke jeden Tag im Dezember eine neue Geschichte und Erinnerung',
    'landing.enter': 'Kalender öffnen',
  },
  en: {
    'calendar.title': "Tilman's Advent Calendar",
    'calendar.welcome': 'Welcome',
    'calendar.admin': 'You are admin',
    'calendar.adminPanel': 'Admin Panel',
    'calendar.logout': 'Logout',
    'door.loading': 'Loading...',
    'door.close': 'Close',
    'door.likes': 'Likes',
    'door.likeStory': 'Like',
    'door.unlikeStory': 'Unlike',
    'door.yourMessage': 'Your message to me (Tilman)',
    'door.writeMessage': 'Write me (Tilman) a message...',
    'door.send': 'Send',
    'door.delete': 'Delete',
    'door.noMessages': "You haven't left me a message yet",
    'admin.panelTitle': 'Admin Panel',
    'admin.contentManagement': 'Content Management',
    'admin.userProgress': 'User Progress',
    'admin.reactions': 'Reactions',
    'admin.overview': 'Overview',
    'admin.comments': 'Comments',
    'admin.latestComments': 'Latest Comments',
    'admin.likesPerDoor': 'Likes per Door',
    'admin.door': 'Door',
    'admin.dayNumber': 'Day Number',
    'admin.entryTitle': 'Title',
    'admin.titleEnglish': 'Title (English)',
    'admin.story': 'Story',
    'admin.storyEnglish': 'Story (English)',
    'admin.images': 'Images/Videos',
    'admin.audio': 'Audio (Optional)',
    'admin.save': 'Save',
    'admin.update': 'Update',
    'admin.cancel': 'Cancel',
    'admin.uploading': 'Uploading...',
    'admin.translate': 'Translate to English',
    'admin.translating': 'Translating...',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'landing.title': "Tilman's Advent Calendar",
    'landing.subtitle': 'Discover a new story and memory each day throughout December',
    'landing.enter': 'Open Calendar',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('de');

  useEffect(() => {
    const loadLanguagePreference = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.preferred_language) {
          setLanguageState(profile.preferred_language as Language);
        }
      }
    };

    loadLanguagePreference();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from("profiles")
        .update({ preferred_language: lang })
        .eq("id", session.user.id);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
