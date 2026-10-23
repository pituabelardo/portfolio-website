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

  /* islands in the 3d world: position [x, z], color theme, dom id.
     order = importance (liga u first, the main case). the world
     itself only reads positions — seeds and orientation derive from pos, so
     reordering never moves anything. `tag` rides along in the captain's
     "land ho" so the two student concepts are never mistaken for clients. */
  ISLANDS: [
    { id: "liga-u-strategy", name: "liga u — strategy", pos: [58, 48], color: 0xffd23f },
    { id: "capullos",  name: "capullos",              pos: [-26, 92],  color: 0x3ec46d, tag: "a liga u campaign" },
    { id: "talens-pantone", name: "talens x pantone",  pos: [-118, -52],  color: 0xff5a3c, tag: "student concept, utrecht" },
    { id: "ministerie", name: "ministerie van justitie", pos: [108, -96], color: 0x2b47d9, tag: "student concept, utrecht" },
  ],
};
