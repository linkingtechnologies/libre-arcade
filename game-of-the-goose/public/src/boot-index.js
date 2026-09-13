import { applyDocumentTranslations, mountLanguageSwitcher } from "./i18n.js";

applyDocumentTranslations(document);
mountLanguageSwitcher({ onChange: () => applyDocumentTranslations(document) });
