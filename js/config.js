/* ============================================================
   jorge antolín — portfolio config
   the only file you should ever need to touch.
   ============================================================ */

window.PORTFOLIO_CONFIG = {

  /* (a) capullos youtube videos — one entry per language cut.
     paste the id only: for https://youtube.com/watch?v=dQw4w9WgXcQ the id
     is "dQw4w9WgXcQ". the first entry is the one that loads; if there is
     more than one, the case shows a chip per cut to swap between them.
     `label` is what the chip says, `lang` is the bcp-47 tag. */
  CAPULLOS_VIDEOS: [
    { lang: "en", label: "english",  id: "zHokzNbwlV4" },
    { lang: "es", label: "español",  id: "nzK2vCV108I" },
  ],

  /* legacy single-video field — still honoured if CAPULLOS_VIDEOS is empty */
  CAPULLOS_YOUTUBE_ID: "",

  /* (c) social links — they appear in the about section and in schema.org.
     add as many as you want. */
  SOCIAL_LINKS: [
    // { label: "linkedin", url: "https://www.linkedin.com/in/..." },
    // { label: "instagram", url: "https://www.instagram.com/..." },
  ],

  /* (d) contact panel — opens from the "jorge antolín" pill in the topbar.
     keep email in sync with index.html (about + JSON-LD) and /llms.txt.
     the cv pdfs are built by cv-src/build.sh into /cv/ (README (f)). */
  CONTACT: {
    email: "hello@jorge.eus",
    phone: "+34 684 64 10 01",
    linkedin: "https://www.linkedin.com/in/jorge-antolin/",
    cv: [
      { lang: "en", label: "english", href: "/cv/jorge-antolin-cv-en.pdf" },
      { lang: "es", label: "español", href: "/cv/jorge-antolin-cv-es.pdf" },
    ],
  },

  /* islands in the 3d world: position [x, z], color theme, dom id.
     order = importance (liga u first, the main case). the world
     itself only reads positions — seeds and orientation derive from pos, so
     reordering never moves anything. `tag` rides along in the captain's
     "land ho" so the two concept campaigns are never mistaken for clients. */
  ISLANDS: [
    { id: "liga-u-strategy", name: "liga u — strategy", pos: [58, 48], color: 0xffd23f },
    { id: "capullos",  name: "capullos",              pos: [-26, 92],  color: 0x3ec46d, tag: "a liga u campaign" },
    { id: "ai-direction", name: "ai video & art direction", pos: [150, 45], color: 0xa66bff },
    { id: "talens-pantone", name: "talens x pantone",  pos: [-118, -52],  color: 0xff5a3c, tag: "concept campaign" },
    { id: "ministerie", name: "ministerie van justitie", pos: [108, -96], color: 0x2b47d9, tag: "concept campaign" },
  ],
};
