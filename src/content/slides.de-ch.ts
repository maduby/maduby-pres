import { slidesSchema } from "@/lib/deck/schema";
import fernwehPhoto from "../../docs/storyline/assets/fernweh.webp";
import housepartyPhoto from "../../docs/storyline/assets/houseparty.webp";
import cityVanPhoto from "../../docs/storyline/assets/city-van.webp";
import mediumBoulderingSpain from "../../docs/storyline/assets/medium-bouldering-spain.webp";
import mediumMuizenbergBeachDogs from "../../docs/storyline/assets/medium-muizenberg-beach-dogs.webp";
import mediumVanSwitzerland from "../../docs/storyline/assets/medium-van-switzerland-zoe-marc.webp";
import dogsOnLeadPhoto from "../../docs/storyline/assets/dogs-on-lead.webp";
import eastBeachPhoto from "../../docs/storyline/assets/east-beach.webp";
import mapPhoto from "../../docs/storyline/assets/map.webp";
import muizenbergPhoto from "../../docs/storyline/assets/muizenberg.webp";
import nomadContractPhoto from "../../docs/storyline/assets/nomad-contract.webp";
import newsroomDeskPhoto from "../../docs/storyline/assets/newsroom-desk.webp";
import rabbitPhoto from "../../docs/storyline/assets/rabbit.webp";
import slide1Photo from "../../docs/storyline/assets/slide1.webp";
import slide3Photo from "../../docs/storyline/assets/slide3b.webp";
import swagPhoto from "../../docs/storyline/assets/swag.png";
import timezonesPhoto from "../../docs/storyline/assets/timezones.webp";
import toolsPhoto from "../../docs/storyline/assets/tools.webp";
import tulaShoesPhoto from "../../docs/storyline/assets/tula-shoes.webp";
import zurichMistPhoto from "../../docs/storyline/assets/zurich-mist.webp";
import tnhTeam2Photo from "../../docs/storyline/assets/tnh-team-2.webp";
import tnhTeamPhoto from "../../docs/storyline/assets/tnh-team.webp";
import vibeCodingMeme from "../../docs/storyline/assets/vibe-coding.webp";

const rawSlides = [
  {
    kind: "title" as const,
    title: "Marc Duby",
    subline: [
      {
        html: "Von Marc <s>Fehr</s> zu <strong>Duby</strong> – 39 Jahre ",
      },
      { brutalChip: { label: "SWAG" } },
      " in 30 Minuten.",
    ],
    image: {
      src: swagPhoto,
      alt: "Marc Duby — Portrait",
    },
  },
  {
    kind: "section" as const,
    kicker: "FHGR · Zukunft 1",
    title: "Ein guter Ort für Zufälle",
    subtitle: "Und ich dachte, das sei alles irgendwie planbar.",
    image: {
      src: mapPhoto,
      alt: "Weltkarte — Distanz, Planung und Zufall",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Altstätten, 1987",
      paragraphs: [
        "Kleinstadt, Grenze, Alltag. Ausbildung, Arbeit – und irgendwann dann doch die «grosse Welt».",
      ],
    },
    right: {
      kind: "image" as const,
      src: slide3Photo,
      alt: "Altstätten — Kleinstadt, Grenze, Ausgangspunkt",
      ratioClass: "aspect-[3/2] w-full max-w-6xl mx-auto",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Muizenberg, 2026",
      paragraphs: [
        "Strand, Remote Work. Wie ich dann irgendwie doch auf der anderen Seite der Erdkugel gelandet bin.",
      ],
    },
    right: {
      kind: "image" as const,
      src: muizenbergPhoto,
      alt: "Muizenberg — Küste, Alltag, Zuhause am Atlantik",
      ratioClass: "aspect-[3/2] w-full max-w-6xl mx-auto",
    },
  },
  {
    kind: "livePoll" as const,
    kicker: "Live Umfrage",
    question: "Was möchtet ihr heute am liebsten vertieft besprechen?",
    options: [
      "Werdegang & Jobs",
      "Learnings aus Newsrooms",
      "Hürden & Remote",
      "Technik & Tools",
    ],
  },
  {
    kind: "text" as const,
    heading: "HTML mit dreizehn",
    paragraphs: [
      "Meine Reise in die Welt des «Web Development» startete im Jahr 1990 — ich brachte mir das Handwerk damals selbst aus Spass bei.",
      "Ich liess es lange Jahre liegen, bis ich es an der FHGR wiederentdeckte.",
    ],
  },
  {
    kind: "livePoll" as const,
    kicker: "Live Umfrage",
    question: "Findet ihr Web-Entwicklung eigentlich Spass?",
    options: ["Ja!", "Nein!", "Irgendwie schon …"],
  },
  {
    kind: "text" as const,
    heading: 'Das «duale» Ausbildungssystem',
    paragraphs: [
      "Lehre als verankerte Institution — vermutlich einzigartig in der Schweiz.",
      "Abschluss mit Diplom. Ein Schreiner ist ein Schreiner.",
      "Aber: Tunnelblick der Arbeiterbienen.",
    ],
  },
  {
    kind: "livePoll" as const,
    kicker: "Live Umfrage",
    question: "Welcher Weg hat dich (grob) zur FH geführt?",
    options: ["Lehre", "Kantonsschule", "Andere"],
  },
  {
    kind: "timeline" as const,
    heading: "Stationen",
    items: [
      {
        period: "2003 ff.",
        title: "Lehre & Arbeit",
        body: "Lehrbeginn mit sechzehn. Später Rekrutenschule (mit neunzehn). Viele Jahre Leica Geosystems, Global Logistics — Disziplin, Prozesse, internationale Lieferketten.",
      },
      {
        period: "2009–2010",
        title: "Berufsmatura Vaduz",
        body: "Gestalterische Richtung — neben dem Job. Die formale Brücke zur FH.",
      },
      {
        period: "2011–2014",
        title: "FHGR · BSc Web and Media Applications",
        body: 'Major Web and Media Application. Code, Medien, Projekte — die Basis für «Konvergenz» — oder das Streben nach «Generalismus»?',
      },
      {
        period: "Chur / Felsberg",
        title: "Agenturen, Film, Generalist",
        body: "Praktika, erste Jobs: Web, Bild, viele Hüte. Auch Marketing — bis mir klar wurde, dass ich darin nicht bleiben wollte.",
      },
    ],
  },
  {
    kind: "text" as const,
    heading: "FHGR, Zürich, Abenteuer",
    paragraphs: [
      "Viel gelernt im Studium — sowohl während als auch ausserhalb des Unterrichts: Projekte, Nächte, Menschen, die bleiben.",
      [
        "Die FHGR war mehr als Vorlesungen — Zürich, Chur, Freund*innen, erste echte «Wir bauen was»-Momente. Das prägt. ",
        { brutalChip: { label: "VIBES" } },
      ],
    ],
    image: {
      src: housepartyPhoto,
      alt: "Studium FHGR — zusammen, feiern, ankommen",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
  },
  {
    kind: "text" as const,
    heading: "Liebes Marketing, …",
    paragraphs: [
      "In Kürze: Ich hatte es satt, Kunden dabei zu helfen, Dinge zu verkaufen, die Menschen meiner Meinung nach gar nicht kaufen sollten.",
      "Ich lernte viel — doch Überzeugung und Ökonomie kollidierten. Kopf oder Herz: ich musste mich entscheiden.",
      { brutalChip: { label: "OK BYYYYE" } },
    ],
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Zürich",
      paragraphs: [
        "2015 · Zwischenstation zwischen Chur und dem Tages-Anzeiger — «Grossstadt», neues Terrain.",
      ],
    },
    right: {
      kind: "image" as const,
      src: zurichMistPhoto,
      alt: "Zürich im Nebel — Morgenspaziergang 2016",
      caption: "Morgenspaziergang im 2016 – Zürich im Nebel.",
    },
  },
  {
    kind: "text" as const,
    heading: "Freelance: Film und Web",
    paragraphs: [
      "Ich kündigte, wurde Freelancer unter «Marc Fehr Media», kreierte Filme und Webseiten. An Wochenenden arbeitete ich hinter der Kamera.",
      "Generalist bleiben, aber mit leichterem Herz.",
      "Dann die Bewerbung beim Tages-Anzeiger … Endlich etwas Wahres, dachte ich — den Menschen etwas Wertvolles vermitteln.",
      { brutalChip: { label: "BREAKING NEWS" } },
    ],
    image: {
      src: cityVanPhoto,
      alt: "Ed The Van vor dem Zürcher Kasernenareal — Wohnen in der blauen Zone",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption:
        "Wohnen in der blauen Zone. Hier in Ed The Van vor dem Zürcher Kasernenareal.",
    },
  },
  {
    kind: "livePoll" as const,
    kicker: "Live Umfrage",
    question: "Hattet ihr schon einmal Freelance-Erfahrung?",
    options: ["Ja!", "Hm, nein …"],
  },
  {
    kind: "text" as const,
    heading: "Interaktiver Newsroom Buzz",
    paragraphs: [
      "Gemeinsam mit Marc Brupbacher baute ich 2015 das neu entstandene Interaktiv-Team des Tages-Anzeigers auf.",
      "Tempo, Publikation, Qualitätsanspruch: alles auf einmal. Das waren für mich prägende Jahre.",
    ],
    ctasAfterParagraphIndex: 1,
    ctas: [
      {
        label: "Interaktiv Team",
        href: "https://interaktiv.tagesanzeiger.ch/",
      },
    ],
    image: {
      src: newsroomDeskPhoto,
      alt: "Arbeitsplatz im Tages-Anzeiger Newsroom, 2016",
      ratioClass: "aspect-[3/2] w-full",
      caption: "Mein Arbeitsplatz im Tagi-Newsroom früh an einem Morgen im Jahr 2016.",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Olympia · 100-Meter-Sprint",
      paragraphs: [
        "Eines der frühen Formate: der Sprint sichtbar gemacht — Daten, Rhythmus, Fieber.",
        "Bei Interaktiv ging es darum, Sport so zu erzählen, dass man es im Körper spürt.",
      ],
      link: { label: "LINK", href: "https://interaktiv.tagesanzeiger.ch/2016/100meter/" },
    },
    right: {
      kind: "iframe" as const,
      src: "https://interaktiv.tagesanzeiger.ch/2016/100meter/",
      title: "Tages-Anzeiger Interaktiv — 100-Meter-Sprint",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Gotthard — Megaprojekt",
      paragraphs: [
        "Ein Riesenbau als Geschichte: Massstab, Geologie, Menschen.",
        "Solche Projekte zeigen, was digitales Storytelling in einer Redaktion leisten kann.",
      ],
      link: { label: "LINK", href: "https://interaktiv.tagesanzeiger.ch/2016/gotthard/" },
    },
    right: {
      kind: "iframe" as const,
      src: "https://interaktiv.tagesanzeiger.ch/2016/gotthard/",
      title: "Tages-Anzeiger Interaktiv — Gotthard-Basistunnel",
    },
  },
  {
    kind: "section" as const,
    kicker: "2016",
    title: "Fernweh",
    subtitle: "Der Wunsch nach Veränderung.",
    image: {
      src: fernwehPhoto,
      alt: "Marc 2016 — Blick in die Ferne",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption: "Marc im Jahr 2016, Blick weit in die Ferne.",
    },
  },
  {
    kind: "text" as const,
    heading: "Digitaler Nomade — mit Vertrag",
    paragraphs: [
      "Ich wollte reisen, hatte aber kein «ok-bye!»-Vermögen. Zudem mochte ich meinen Job beim Tagi wirklich gut.",
      "Zwei Seiten Konzept: sechs Monate im Ausland, 50 % Gehalt, 50 % Surfen. Auf nach Chiang Mai!",
      "Aber …",
    ],
    image: {
      src: nomadContractPhoto,
      alt: "Zwei-Seiten-Konzept — digitales Nomadentum mit Vertrag",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption: "Mein Konzept fürs digitale Nomadentum.",
    },
  },
  {
    kind: "text" as const,
    heading: "Thailand? Nein. Südafrika.",
    paragraphs: [
      "Zeitzone CET / +1.",
      "Erster Abend in Kapstadt: Silvester, 31.12.2016 — danach sechs Monate dort, neun Monate in Zürich.",
    ],
    image: {
      src: timezonesPhoto,
      alt: "Zeitzonen — Europa und Südafrika (CET +1)",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
  },
  {
    kind: "text" as const,
    heading: "Mainstream News",
    paragraphs: [
      "Ich merkte: Auch eine Zeitung, die ich mag, muss Zeitungen verkaufen.",
      "Wir schreiben oft, was Menschen lesen wollen — nicht immer, was sie lesen sollten. Das war mir zu eng.",
      "Ich wollte raus aus dem Mainstream — und näher an Arbeit, die ich ethisch vertreten kann.",
      "Abhauen … Schon wieder …",
      { brutalChip: { label: "OK BYYYYE" } },
    ],
  },
  {
    kind: "livePoll" as const,
    kicker: "Live Umfrage",
    question: "Warst du schon einmal in Kapstadt?",
    options: ["Ja!", "Nein …"],
  },
  {
    kind: "text" as const,
    heading: "Liebe, Ort, Zuhause",
    paragraphs: [
      "Ich verliebte mich — in Muizenberg und in Zoe, meine Partnerin.",
      "Kapstadt wurde Basis. Irgendwann ein Haus in Südafrika. Das Leben bleibt hybrid: Arbeit global, Füsse oft im Sand.",
      "Ist es nicht gefährlich, in Südafrika zu wohnen? Oder: Ist es nicht erstickend, in der Schweiz zu leben?",
      {
        brutalChip: { label: "Sicherheit != Sicherheit", preserveCase: true },
      },
    ],
    image: {
      src: mediumMuizenbergBeachDogs,
      alt: "Zwei Personen mit Hunden am Strand nahe Muizenberg",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
  },
  {
    kind: "text" as const,
    heading: "Die 60%-Regel",
    paragraphs: [
      "Back to Freelance! Non-profit Preispläne fürs Herz.",
      "Als Freelancer durfte kein Auftraggeber mehr als 60 % meiner Zeit «besitzen».",
      "So blieb Luft für andere Stimmen — und ich fühlte mich nicht gekauft.",
      { brutalChip: { label: "Freelance" } },
    ],
    image: {
      src: mediumVanSwitzerland,
      alt: "Zwei Personen vor einem Campervan «Ed» in der Schweiz",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption: "Van «Ed» · Heimatbesuch · Homebase on Wheels.",
    },
  },
  {
    kind: "text" as const,
    heading: "Non-Profits — endlich Sinn ohne Schaum",
    paragraphs: [
      "Ich arbeitete vermehrt für Organisationen, die nicht primär Wachstum atmen.",
      "Das gab mir Tiefe — und führte mich zu einer Nische, die zu mir passt.",
      "Für Non-Profit-Organisationen zu arbeiten ist mir genauso wichtig wie nicht mehr als 80 % — vier Tage pro Woche — arbeiten zu müssen. Ich mag die Freiheit.",
    ],
    image: {
      src: mediumBoulderingSpain,
      alt: "Zwei Personen beim Bouldern auf Fels in Spanien",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption: "Bouldern — gemeinsam, fokussiert, analog.",
    },
  },
  {
    kind: "section" as const,
    kicker: "März 2019",
    title: "The New Humanitarian",
    ctas: [
      {
        label: "The New Humanitarian",
        href: "https://www.thenewhumanitarian.org/",
      },
    ],
    image: {
      src: tnhTeamPhoto,
      alt: "TNH Newsroom — klein, global",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
  },
  {
    kind: "text" as const,
    heading: "IRIN News wird The New Humanitarian",
    paragraphs: [
      "Drei Monate Vertrag — Website und Branding. Ich blieb.",
      "Drupal, interaktive Formate, Zugänglichkeit, dekoloniales Denken in der Berichterstattung.",
      "Die einzige Tech-Person in einem Team von rund achtzehn Menschen: privilegiert, manchmal einsam, immer verantwortungsvoll.",
      "Wollte keine Anstellung, akzeptierte dann aber einen Vertrag über 80%...",
    ],
  },
  {
    kind: "media" as const,
    src: tnhTeam2Photo,
    alt: "TNH Newsroom — klein, global",
    caption: "TNH Newsroom – klein, global, laut.",
    variant: "wide" as const,
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "The Yemen Listening Project",
      paragraphs: [
        "Stimmen aus dem Krieg, auch via WhatsApp und Sprachnachrichten.",
        "Zuhören statt nur berichten — ein Format, das nah an den Menschen bleibt.",
      ],
      link: {
        label: "LINK",
        href: "https://www.thenewhumanitarian.org/yemenlisteningproject",
      },
    },
    right: {
      kind: "iframe" as const,
      src: "https://www.thenewhumanitarian.org/yemenlisteningproject",
      title: "The New Humanitarian — Yemen Listening Project",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Lebanon Displacement Diaries",
      paragraphs: [
        "Erzählt in zwei Sprachen, nah an den Menschen.",
        "Alltag der Vertreibung sichtbar machen — ohne Abstand zur Betroffenheit.",
      ],
      link: {
        label: "LINK",
        href: "https://interactive.thenewhumanitarian.org/stories/2025/05/22/lebanon-displacement-diaries/home",
      },
    },
    right: {
      kind: "iframe" as const,
      src: "https://interactive.thenewhumanitarian.org/stories/2025/05/22/lebanon-displacement-diaries/home",
      title: "The New Humanitarian — Lebanon Displacement Diaries",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "WhatsApp, Lebanon?",
      paragraphs: [
        "Der Zusammenbruch im Libanon — erzählt über echte WhatsApp-Verläufe und Illustrationen.",
        "Menschlich, bilingual, nah am Alltag — jenseits der Schlagzeile.",
      ],
      link: {
        label: "LINK",
        href: "https://interactive.thenewhumanitarian.org/stories/2022/07/28/whatsapp-lebanon/",
      },
    },
    right: {
      kind: "iframe" as const,
      src: "https://interactive.thenewhumanitarian.org/stories/2022/07/28/whatsapp-lebanon/",
      title: "The New Humanitarian — WhatsApp, Lebanon?",
    },
  },
  {
    kind: "twoColumn" as const,
    left: {
      heading: "Portfolio",
      paragraphs: [
        "Mehr Arbeit, Cases und Referenzen — gesammelt auf duby.io.",
        "Interaktiv, Editorial, und das Handwerk dahinter.",
      ],
      link: { label: "LINK", href: "https://duby.io/portfolio" },
    },
    right: {
      kind: "iframe" as const,
      src: "https://duby.io/portfolio",
      title: "Marc Duby — Portfolio",
    },
  },
  {
    kind: "section" as const,
    title: "Hürden",
    image: {
      src: tulaShoesPhoto,
      alt: "Tula Schuhe am Strand — Ausgleich und Halt ausserhalb des Screens",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption: "Tula im heissen Sand.",
    },
  },
  {
    kind: "text" as const,
    heading: "Find solutions.",
    paragraphs: [
      "Als isolierte Tech-Person trägst du viel — und nicht alles ist für andere sichtbar.",
      "Lösungen heissen für mich: Grenzen setzen, sauber kommunizieren und Schnittstellen klären — statt nur schneller zu liefern.",
      "Typische Hürden in dieser Rolle — zum Benennen, nicht zum Aufgeben:",
    ],
    bullets: [
      "Du bist Anlaufstelle, Feuerwehr, Architekt — und trotzdem Teil einer redaktionellen DNA.",
      "Das geht nur mit Grenzen, Kommunikation und dem Mut, Nein zu sagen.",
      "Ich wollte nie eine Führungsposition, sondern immer nur das machen, was ich gerne mache: kreativ sein, programmieren, im Hintergrund tüfteln.",
      "Geteilte Doku und klare Schnittstellen fehlen oft: Know-how und Risiko bleiben an einer Person hängen.",
    ],
    trailParagraphs: [
      "Als Generalist, «CodeHead» oder Journalist oder Medienprofi wirst du anders gelesen — Stellenprofile sprechen oft nur eine Sprache.",
      "Deine Nische verkaufen heisst: verständlich werden für andere, ohne das Wesentliche zu verwässern.",
      "Drei Rollen, eine Spannung — und wie ich den Pitch denke:",
    ],
    trailBullets: [
      "Generalist: breit genug mitdenken, spezifisch genug, dass du nicht in «irgendwas Digital» zusammenfällst.",
      "«CodeHead»: Tiefe zeigen — ohne dass dich die Redaktion nur als Ticket-Schleuder wahrnimmt.",
      "Journalist oder Medienprofi: Story und Publikum im Zentrum; Tech bleibt Werkzeug, nicht Ersatzidentität.",
      "Pitch: weniger Buzzwords, mehr echte Cases und Verantwortung — und dein Herzstück nicht kleinreden.",
    ],
  },
  {
    kind: "section" as const,
    title: "Learnings",
    image: {
      src: rabbitPhoto,
      alt: "Lumpi — lernt, an der Leine zu gehen",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption: "Beispiel Lumpi: Lernt gerade, an der Leine zu gehen.",
    },
  },
  {
    kind: "text" as const,
    heading: "Stay curious.",
    paragraphs: [
      "Disziplinen zu verbinden — Bild, Code, Story, Organisation — ist kein Mangel an Fokus, sondern Hebelkraft.",
      "Interdisziplinär arbeiten heisst: Teams wirklich zusammenbringen, nicht nur nebeneinander.",
      "Die Nische sucht man nicht im Katalog. Sie entsteht dort, wo deine Ethik, dein Skill und ein Bedarf sich treffen — und wo sich Anstellbarkeit mit Sinn aushandeln lässt.",
    ],
    bullets: [
      "Finde deine Nische",
      "Glaube nicht immer alles in den Stelleninseraten",
      "Schreibe an Organisation, wenn du Fehler siehst",
      "Sei kreativ, baue Dashboards, zeig sie herum",
      "Freelance ist immer eine Option",
      "Setze nie alles auf eine Karte",
    ],
  },
  {
    kind: "quote" as const,
    text: "Idealismus ist keine Naivität. Bequemlichkeit schon eher.",
    attribution: "Randnotiz eines müden Idealisten",
  },
  {
    kind: "section" as const,
    title: "KI und Agenten",
    image: {
      src: toolsPhoto,
      alt: "KI als Werkzeug — Qualität statt nur günstigste Option",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
      caption:
        "KI als Werkzeug – manchmal sollte man sich nicht für die günstigsten Optionen entscheiden...",
    },
  },
  {
    kind: "media" as const,
    src: vibeCodingMeme,
    alt: "Meme zum Thema Vibe Coding",
    caption: 'Welcome to "Vibe Coding" für Anfänger!',
    variant: "wide" as const,
    notes:
      "Speaking: Zwei Hunde an der Leine — super clever, bis sie links und rechts an einer Laterne laufen und stecken bleiben. So fühlen sich Agenten oft an: plötzlich verknotet. Nicht um Jobangst geht es mir — sondern um eine Verschiebung: Vibe Coding («mir egal, Hauptsache läuft») vs. Agentic Engineering (klare Ziele, Review, Verantwortung). Mensch hebt noch ab — und entwirrt. Dot-com-Blase 2.0? Nur erwähnen, wenn es zur Diskussion passt; nicht als Slide-Theorem.",
  },
  {
    kind: "livePoll" as const,
    kicker: "Live Umfrage",
    question: "Wie denkt ihr über KI und die Zukunft?",
    options: [
      "Bullish, let's go!",
      "Nur eine Phase",
      "Wir sind am Arsch...",
      "Weiss nicht...",
    ],
  },
  {
    kind: "text" as const,
    heading: "KI – kind of smart",
    paragraphs: [
      "Agenten können viel — bis sie es nicht können. Dann braucht es wieder eine Person, die neu sortiert.",
      "Vibe Coding und Agentic Engineering sind für mich Welten: Sorgfalt, Kontext, Review gegen «mir egal, shippen».",
      "Ich fürchte meinen Job nicht — aber ich kenne Kolleg:innen, die sich verunsichert fühlen. Das ist real.",
    ],
    image: {
      src: dogsOnLeadPhoto,
      alt: "Zwei Hunde an der Leine — Analogie zu KI-Agenten",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
    notes:
      "Speaking: Laterne-Analogie ausführen. Dot-com-Vergleich nur mündlich, nicht als grosse These auf der Wand.",
  },
  {
    kind: "text" as const,
    heading: "Pro tip: Findet den Ausgleich",
    paragraphs: [
      "Für mich heisst das Berge, Klettern, Trailrunning, Meer, Surfe – alles, was nicht aus Pixeln besteht.",
    ],
    ctas: [
      {
        label: "@anotherhairyman · Instagram",
        href: "https://www.instagram.com/anotherhairyman/",
      },
      { label: "Medium", href: "https://marcduby.medium.com/" },
    ],
    ctasAfterParagraphIndex: 0,
    image: {
      src: slide1Photo,
      alt: "Ausgleich abseits vom Bildschirm — Berge, Bewegung, Meer",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
    notes:
      "Optional nennen: marcduby.medium.com/foregoing-offspring-for-the-climate-93c52e04818d — Kinderfreiheit, Klima, gesellschaftliche Doppelmoral.",
  },
  {
    kind: "text" as const,
    heading: "Danke fürs Zuhören",
    paragraphs: ["Ich freue mich auf eure Fragen – und auf einen Kafi am Strand!"],
    ctas: [
      { label: "duby.io", href: "https://www.duby.io" },
      { label: "marc@duby.io", href: "mailto:marc@duby.io" },
    ],
    ctasAfterParagraphIndex: 0,
    image: {
      src: eastBeachPhoto,
      alt: "Strand Ostküste — Abschluss der Präsentation",
      ratioClass: "aspect-[3/2] w-full",
      frameClass: "max-w-[min(100%,720px)] sm:max-w-[min(100%,820px)] md:max-w-[900px]",
      sizes: "(max-width: 768px) 92vw, min(900px, 90vw)",
    },
  },
];

export const slides = slidesSchema.parse(rawSlides);
