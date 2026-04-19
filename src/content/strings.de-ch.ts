export const uiStrings = {
  slideLabel: "Folie",
  of: "von",
  prev: "Zurück",
  next: "Weiter",
  progress: "Fortschritt",
  copyLink: "Link zu dieser Folie kopieren",
  copied: "Kopiert",
  presenterMode: "Presenter-Modus",
  presenterHint:
    "Pfeiltasten oder Leertaste. Home/Ende für Anfang/Ende. «Link kopieren» für Studierende.",
  presenterKeyLabel: "Presenter-Code",
  presenterKeyPlaceholder:
    "Vollständigen Wert von PRESENTER_SECRET einfügen (.env.local oder Vercel)",
  presenterKeyStored: "Code wird für diese Sitzung gespeichert (nur in diesem Browser).",
  followPresenter: "Folien dem Vortragenden folgen",
  followHint:
    "Benötigt Supabase (Realtime). Ohne Setup funktionieren Deep-Links mit ?s= weiterhin.",
  synced: "Live-Sync",
  openWebsite: "Webseite öffnen",
  reactionsTitle: "Reaktionen",
  reactionsHint:
    "Tippe wie in Teams – alle sehen die Animation (Realtime).",
  reactionHeart: "Herz",
  reactionFire: "Wow / stark",
  reactionClap: "Applaus",
  reactionWow: "Überrascht",
  reactionParty: "Freude",
} as const;
