/* ============================================================
   jorge antolín — portfolio config
   the only file you should ever need to touch.
   ============================================================ */

window.PORTFOLIO_CONFIG = {

  /* (a) capullos youtube video:
     paste the id only — for https://youtube.com/watch?v=dQw4w9WgXcQ
     the id is "dQw4w9WgXcQ" */
  CAPULLOS_YOUTUBE_ID: "",

  /* (c) social links — they appear in the about section and in schema.org.
     add as many as you want. */
  SOCIAL_LINKS: [
    // { label: "linkedin", url: "https://www.linkedin.com/in/..." },
    // { label: "instagram", url: "https://www.instagram.com/..." },
  ],

  /* islands in the 3d world: position [x, z], color theme, dom id */
  ISLANDS: [
    { id: "capullos",  name: "capullos",              pos: [-26, 92],  color: 0x3ec46d },
    { id: "liga-u-strategy", name: "liga u — strategy", pos: [58, 48], color: 0xffd23f },
    { id: "talens-pantone", name: "talens x pantone",  pos: [-118, -52],  color: 0xff5a3c },
    { id: "ministerie", name: "ministerie van justitie", pos: [108, -96], color: 0x2b47d9 },
  ],
};
