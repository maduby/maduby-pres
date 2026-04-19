import { slidesSchema } from "@/lib/deck/schema";

const rawSlides = [
  {
    kind: "title",
    title: "Marc Duby",
    subline:
      "Senior Full-Stack Web Developer · Interactive Storytelling · UX-getriebene Entwicklung",
    image: {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
      alt: "Berge im Abendlicht – Symbol für Ausgleich neben dem Bildschirm",
      width: 1200,
      height: 800,
    },
  },
  {
    kind: "text",
    heading: "Das bin ich – kurz gefasst",
    paragraphs: [
      "Schweizer Citizen, wohnhaft in Kapstadt (Südafrika) – remote im Schweizer Zeitfenster.",
      "Seit 2019 Senior Web Developer bei The New Humanitarian. Davor Interaktiv beim Tages-Anzeiger.",
      "Seit 2014 Lehre an der FHGR (Interactive Media / moderne Web-Entwicklung) und früher auch an der MAZ Luzern.",
      "Ich verbinde Storytelling, Daten und solide Web-Technik – von Konzept bis Deployment.",
    ],
  },
  {
    kind: "section",
    kicker: "Heute",
    title: "Werdegang, Learnings, Hürden & Lösungen",
  },
  {
    kind: "text",
    heading: "Agenda",
    paragraphs: [
      "1) Werdegang (Ausbildung → erste Jobs → Newsroom → Non-Profit)",
      "2) Learnings aus über 10 Jahren digitalem Journalismus und Web-Engineering",
      "3) Hürden (Remote, Komplexität, Sicherheit, Organisation) und wie ich sie angehe",
      "4) Zeit für eure Fragen",
    ],
  },
  {
    kind: "timeline",
    heading: "Ausbildung & frühe Stationen",
    items: [
      {
        period: "2004–2006",
        title: "Lehre Kaufmann",
        body: "Grundlagen: Arbeiten in Strukturen, Kunden, Prozesse – später nützlich für Projektmanagement.",
      },
      {
        period: "2004–2010",
        title: "Leica Geosystems, Logistik",
        body: "Operative Arbeit in globaler Logistik: Resilienz, Teamkoordination, Lieferketten denken.",
      },
      {
        period: "2008–2010",
        title: "Berufsmaturität, Liechtenstein",
        body: "Formale Grundlage für die FH – Disziplin und Breite neben dem Beruf.",
      },
      {
        period: "2011–2014",
        title: "BSc Media Engineering",
        body: "Schwerpunkt Web & Mobile, dazu Dataviz, Journalismus, Design, Programmieren – die Basis für «alles verbinden».",
      },
    ],
  },
  {
    kind: "text",
    heading: "Erste Schritte Richtung Medien & Web",
    paragraphs: [
      "Praktika bei skipp.ch (Frontend) und onairag.ch (Kamera/Schnitt): technische und audiovisuelle Hands-on-Erfahrung.",
      "Freelance als Entwickler und Filmemacher: Selbständigkeit, Verkauf, Liefern unter Ressourcendruck.",
      "Diese Mischung aus Bild, Code und Story hat meinen Fokus auf interaktives Storytelling geprägt.",
    ],
  },
  {
    kind: "section",
    title: "Tages-Anzeiger Interaktiv",
    kicker: "2015–2018",
  },
  {
    kind: "twoColumn",
    left: {
      heading: "Erster Mitarbeitender im Interaktiv-Team",
      paragraphs: [
        "Aufbau von Formaten, die Daten und Narrative zusammenbringen – direkt im Newsroom-Alltag.",
        "European Newspaper Awards, Swiss Press Award u.a. für Projekte wie VBZ-Verspätungen, Olympia-Sprint, «Plötzlich arm in der reichen Stadt Zürich».",
        "Hier habe ich gelernt: Tempo, Publikation, Qualität – alles gleichzeitig.",
      ],
    },
    right: {
      kind: "iframe",
      src: "https://www.openstreetmap.org/export/embed.html?bbox=8.48%2C47.35%2C8.58%2C47.41&layer=mapnik",
      title: "Beispiel-Embed (OpenStreetMap Zürich) – ersetze durch dein Lieblingsprojekt",
    },
  },
  {
    kind: "quote",
    text: "Im Newsroom zählt nicht nur Code – sondern ob die Geschichte für Menschen verständlich wird, wenn es brennt.",
    attribution: "Learning aus der Interaktiv-Zeit",
  },
  {
    kind: "section",
    title: "Umzug nach Kapstadt",
    kicker: "2017",
  },
  {
    kind: "text",
    heading: "Warum der Sprung in die Ferne?",
    paragraphs: [
      "Persönliche Entscheidung: neue Perspektive, Sprache, Kultur – und trotzdem weiter mit Schweizer Organisationen arbeiten.",
      "Remote-Zusammenarbeit ist machbar, braucht aber klare Kommunikation und Erwartungsmanagement (Zeit, Verfügbarkeit, Tools).",
      "Heute: Arbeit im CH-Zeitfenster, Lehre an der FHGR weiterhin möglich.",
    ],
  },
  {
    kind: "section",
    title: "The New Humanitarian",
    kicker: "2019–heute",
  },
  {
    kind: "twoColumn",
    left: {
      heading: "Tech-Verantwortung in einer globalen Newsroom",
      paragraphs: [
        "Drupal-Site mit sehr vielen Artikeln pflegen und weiterentwickeln.",
        "Interaktive Storytelling-Plattform mit SvelteKit aufgebaut und ausgebaut.",
        "Security, Datenhygiene, Zusammenarbeit mit externen Partnern – immer mit Fokus auf Zugänglichkeit und Verlässlichkeit.",
      ],
    },
    right: {
      kind: "image",
      src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80",
      alt: "Erdkugel-Netzwerk – symbolisch für globale Berichterstattung",
      caption: "Platzhalter-Bild; ersetze durch Screenshot eines TNH-Projekts.",
    },
  },
  {
    kind: "text",
    heading: "Auszeichnungen (Auswahl)",
    paragraphs: [
      "One World Media Awards (mehrfach), Covering Climate Now, Longlists bei IIB Awards.",
      "Das motiviert – aber der Massstab bleibt: hilft es den Betroffenen und den Leserinnen, die Geschichte zu verstehen?",
    ],
  },
  {
    kind: "section",
    title: "Lehre & Wissensweitergabe",
    kicker: "FHGR & MAZ",
  },
  {
    kind: "text",
    heading: "Was ich in Vorlesungen betone",
    paragraphs: [
      "Moderne Web-Grundlagen: semantisches HTML, zugängliche Patterns, Performance.",
      "Frameworks (React, Svelte, Vue) als Werkzeuge – nicht als Selbstzweck.",
      "Von Datenvisualisierung bis CMS: wie man komplexe Inhalte strukturiert, ohne Nutzer zu überfordern.",
    ],
  },
  {
    kind: "section",
    title: "Learnings",
  },
  {
    kind: "text",
    heading: "Was sich immer wieder bewährt",
    paragraphs: [
      "Kleine Releases schlagen grosse «Big Bangs» – auch in Redaktionen.",
      "User Research und Redaktion zusammendenken: Technik folgt der Story, nicht umgekehrt.",
      "Dokumentation und Übergaben sind Teil der Lieferung – gerade in Non-Profits mit wechselnden Teams.",
    ],
  },
  {
    kind: "section",
    title: "Hürden & Lösungen",
  },
  {
    kind: "timeline",
    heading: "Typische Reibungspunkte – und mein Ansatz",
    items: [
      {
        period: "Komplexität",
        title: "Viele Systeme, viele Stakeholder",
        body: "Klare Schnittstellen, Architektur-Skizzen, «single sources of truth» wo möglich.",
      },
      {
        period: "Security",
        title: "Bedrohungslage & Erwartungen",
        body: "Pragmatische Härtung, Reviews, schrittweise Verbesserung statt Panik-Projekte.",
      },
      {
        period: "Remote",
        title: "Distanz in Teams",
        body: "Schriftlichkeit, zeitliche Fenster, transparente Prioritäten – und gelegentlich Face-to-Face.",
      },
      {
        period: "Story-Druck",
        title: "Deadline naht",
        body: "Scope schneiden, Risiken benennen, danach iterativ nachziehen.",
      },
    ],
  },
  {
    kind: "text",
    heading: "Skills (ohne Buzzword-Bingo)",
    paragraphs: [
      "Frontend: TypeScript, React, SvelteKit; Backend: Node, PHP, Python je nach Projekt.",
      "CMS: Drupal, WordPress, Headless (Storyblok, Contentful …).",
      "DevOps: Cloudflare, Vercel, AWS – je nach Budget und Team.",
      "Design/UX: Figma, Prototyping, enge Zusammenarbeit mit Redaktion und Design.",
    ],
  },
  {
    kind: "media",
    src: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80",
    alt: "Trailrunning in den Bergen",
    caption: "Ausgleich: Berge, Trailrunning, Klettern, Biken.",
    credit: "Foto: Unsplash (Platzhalter)",
    variant: "wide",
  },
  {
    kind: "text",
    heading: "Kontakt & mehr",
    paragraphs: [
      "Web: duby.io · E-Mail: marc@duby.io",
      "Danke fürs Zuhören – ich freue mich auf eure Fragen.",
    ],
  },
];

export const slides = slidesSchema.parse(rawSlides);
