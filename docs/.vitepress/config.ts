import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "XulHub SDK",
  description:
    "Official documentation for the XulHub SDK - Create interactive notebook exercises.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Examples", link: "/examples/" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is XulHub SDK?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Notebook Structure", link: "/guide/notebook-structure" },
            { text: "Lifecycle", link: "/guide/lifecycle" },
            { text: "Importing Content", link: "/guide/importing" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "SDK Core", link: "/api/" },
            { text: "Quiz Manager", link: "/api/quiz-manager" },
            { text: "Utilities", link: "/api/utilities" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Showcase", link: "/examples/" },
            { text: "True or False", link: "/examples/true-or-false" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/Phero49/xulhub-sdk" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present XulHub",
    },
  },
});
