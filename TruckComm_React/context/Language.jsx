import { useLocales } from "expo-localization";
import { createContext, useContext, useEffect, useState } from "react";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import languages, { defaultLang } from "../assets/languages";
import Loading from "../components/Loading";

const LanguageContext = createContext({
    messages: {},
    lang: "",
    setLang: () => { }
});

export const useLocale = () => useContext(LanguageContext);

export function LanguageProvider({ children }) {

    const locales = useLocales();
    const storage = useAsyncStorage("language");

    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState(null);

    async function getInitialLang() {
        const setting = await storage.getItem();
        return setting ?? (locales.map(locale => locale.languageCode).find(lang => lang in languages)) ?? defaultLang;
    }

    useEffect(() => {
        setLoading(true);
        getInitialLang()
            .then(setLang)
            .finally(() => setLoading(false));
    }, []);

    return (
        <LanguageContext.Provider value={{ messages: languages[lang], lang, setLang }}>
            {loading ? <Loading /> : children}
        </LanguageContext.Provider>
    );
};
