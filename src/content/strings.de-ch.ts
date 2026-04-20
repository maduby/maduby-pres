export const uiStrings = {
  slideLabel: "Folie",
  of: "von",
  prev: "Zurück",
  next: "Weiter",
  progress: "Fortschritt",
  presenterMode: "Presenter-Modus",
  presenterHint:
    "Presenter: Pfeiltasten oder Leertaste. Home/Ende für Anfang/Ende. Publikum nutzt die Startseite (ohne /present).",
  studentHint:
    "Du siehst dieselbe Folie wie der Vortrag, sobald jemand live präsentiert. Selbst blättern? Tippe danach LIVE, um wieder mitzugehen.",
  presenterViewBadge: "Presenter-Ansicht",
  presenterKeyLabel: "Presenter-Code",
  presenterKeyPlaceholder:
    "Vollständigen Wert von PRESENTER_SECRET einfügen (.env.local oder Vercel)",
  presenterKeyStored:
    "Optional: Bearer für Skripte/API. Die Seite ist zusätzlich per Login mit PRESENTER_SECRET geschützt.",
  presenterLoginTitle: "Presenter anmelden",
  presenterLoginHint:
    "Passwort entspricht dem Wert von PRESENTER_SECRET (lokal .env.local, auf Vercel Projekt-Variablen).",
  presenterLoginPasswordLabel: "Presenter-Passwort",
  presenterLoginSubmit: "Weiter zur Presenter-Ansicht",
  presenterLoginSubmitting: "Wird geprüft …",
  presenterLoginError: "Zugang verweigert — Passwort prüfen.",
  presenterLoginNetworkError: "Netzwerkfehler — bitte erneut versuchen.",
  presenterLeaseLostBanner: "Steuerung übernommen — ein anderer Presenter ist aktiv.",
  presenterLeaseLostDetail:
    "Dieses Fenster hat die exklusive Presenter-Lease verloren (z. B. zweites Tab oder Fenster neu geöffnet). Schliesse andere Presenter-Tabs, warte ~90s — oder übernimm die Steuerung mit dem Button unten (andere Presenter-Tabs verlieren sie).",
  presenterLeaseTakeover: "Steuerung übernehmen",
  presenterLeaseTakeoverBusy: "Wird übernommen …",
  presenterLogout: "Presenter abmelden",
  followPresenter: "Folien dem Vortragenden folgen",
  followHint:
    "Optional: mit dem Publikum mitschauen (Realtime). Für das Publikum ist Live-Follow standardmässig aktiv.",
  liveSyncDisabled: "Supabase nicht konfiguriert — Live-Sync nicht verfügbar.",
  synced: "LIVE",
  liveResumeCta: "LIVE",
  liveResumeHint: "Zurück zur Live-Folie",
  liveFollowingHint: "Synchron mit dem Vortrag",
  liveToggleTurnOn: "Live-Follow einschalten — Folien dem Vortrag folgen",
  liveToggleTurnOff: "Live-Follow ausschalten — selbst blättern",
  /** Shown until the first Realtime presence sync (compact header chip) */
  viewersOnlinePendingShort: "…",
  viewersOnlineTitle:
    "Geräte, die gerade mit dieser Präsentation verbunden sind (Realtime)",
  openWebsite: "Webseite öffnen",
  reactionsTitle: "LIVE FEEDBACK",
  liveFeedbackTitle: "LIVE FEEDBACK",
  reactionsUnavailable: "Live-Reaktionen derzeit nicht verfügbar.",
  feedbackToggleShow: "LIVE FEEDBACK",
  feedbackToggleHide: "Schliessen",
  /** Short label for the collapsed vertical rail */
  feedbackTabVertical: "LIVE",
  feedbackOpenSidebarAria: "Live Feedback öffnen",
  feedbackCloseSidebarAria: "Live Feedback schliessen",
  reactionHeart: "Herz",
  reactionFire: "Lit / stark",
  reactionClap: "Applaus",
  reactionWow: "Überrascht",
  reactionParty: "Feiern",
  reactionSkull: "Ich—",
  reactionSob: "Sobbing (lustig)",
  reactionClown: "Clown-Moment",
  reactionSparkle: "Aura / slay",
  reactionHundred: "100 Prozent",
  reactionGoat: "GOAT",
  reactionSalute: "Respekt",
  reactionCap: "Cap?",
  reactionHandshake: "Fair / deal",
  reactionPopcorn: "Drama geniessen",
  reactionEyes: "Ich schau zu",
  reactionHeartHands: "Herzchen",
  reactionMindBlown: "Mind blown",
  reactionSwag: "SWAG — für alle gross einblenden",
  pollKickerBadge: "Live Umfrage",
  pollSupabaseRequired: "Ohne Supabase-Realtime keine Live-Umfrage.",
  pollPresenterIntro:
    "Starten schaltet die Umfrage für alle auf dieser Folie frei. Ergebnisse erscheinen hier live.",
  pollStartLive: "Umfrage live schalten",
  pollStopLive: "Live-Umfrage stoppen",
  pollEndedPresenter: "Umfrage beendet",
  pollStartAgain: "Neue Runde starten",
  pollTotalVotesLive: "Stimmen (live)",
  pollTotalVotesFinal: "Stimmen total",
  pollAudienceOffline: "Live-Umfrage ist nur mit konfiguriertem Supabase verfügbar.",
  pollAudienceWaiting: "Warte — der Vortragende schaltet die Umfrage gleich live.",
  /** Shown above vote buttons while results update live for everyone */
  pollAudienceVotePrompt:
    "Live-Resultat für alle sichtbar. Deine Stimme: einmal wählen — danach siehst du nur noch die laufenden Ergebnisse.",
  pollAudienceThanks: "Danke — deine Stimme ist gezählt.",
  pollAudienceClosed: "Die Umfrage ist beendet — finales Resultat:",
  preStartTitle: "Präsentation startet in Kürze…",
  preStartSyncing: "Mit dem Live-Server verbinden …",
  preStartJoinLead: "Jetzt mitmachen",
  preStartAudienceLead:
    "Live-Feedback geht schon. Die Folien folgen mit dem Start.",
  preStartPresenterLead:
    "Mit Start schaltest du Folien und Navigation für alle frei.",
  preStartExplainNavBefore:
    "Oben rechts:",
  preStartExplainNavAfter:
    "oder Pfeile, Leertaste, Bild auf/ab, Pos1/Ende.",
  preStartExplainLiveBefore: "",
  preStartExplainLiveAfter:
    "folgt der Live-Folie. Ohne LIVE blätterst du selbst.",
  preStartExplainFeedbackBefore: "",
  preStartExplainFeedbackAfter:
    "öffnet LIVE FEEDBACK. Desktop: Sidebar. Mobile: Panel.",
  preStartExplainReactionsBefore: "",
  preStartExplainReactionsAfter:
    "schicken Reaktionen an alle. Mehrfach tippen verstärkt den Effekt kurz.",
  preStartExplainPolls:
    "Umfragen schaltet der Vortrag live frei.",
  preStartDuckGameAria:
    "Mini-Spiel im Wartezimmer: Tippen oder klicken, damit die Ente springt. Nach einem Crash erneut tippen.",
  preStartDuckGameHint:
    "Tippen oder klicken: Die Ente springt. Nach einem Crash erneut tippen.",
  preStartDuckGameIdle: "TIPP / KLICK",
  preStartDuckGameCrash: "QUAK! NOCHMAL",
  preStartCta: "Präsentation starten",
  preStartStarting: "Wird gestartet …",
  preStartPresenterNote:
    "Nur ein Presenter-Tab kann die Folien steuern. Nach dem Start läuft ein Timer ab diesem Moment.",
  preStartHeaderBadge: "Wartezimmer",
  preStartLeaseError:
    "Steuerung nicht verfügbar — möglicherweise ist ein anderer Presenter aktiv. Tab schliessen oder ~90s warten.",
  preStartGenericError: "Start fehlgeschlagen — bitte erneut versuchen.",
  preStartErrorSessionRow:
    "Keine Deck-Session in der Datenbank — prüfe NEXT_PUBLIC_DECK_SESSION_ID und ob eine Zeile in deck_sessions existiert.",
  preStartErrorAuth:
    "Nicht angemeldet — Presenter-Login erneuern oder Seite neu laden.",
  preStartErrorConfig:
    "Server-Konfiguration unvollständig (Supabase oder Session-ID).",
  preStartErrorMigration:
    "Datenbank-Migration fehlt — in Supabase die SQL-Migrationen ausführen (u. a. presenter_start_presentation, presentation_started_at).",
  presentationTimerLabel: "Laufzeit",
  presenterPause: "Pause",
  presenterResume: "Weiter",
  presenterStop: "Präsentation beenden",
  audiencePausedBanner: "Pausiert — die Folie wird gleich fortgesetzt.",
} as const;
