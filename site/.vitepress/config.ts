import { defineConfig } from "vitepress";

const repo = "https://github.com/mintopia/encore";

export default defineConfig({
  title: "Encore",
  description: "Run Spotify Soloist headless on a Raspberry Pi, with a web console, multi-room Snapcast and zero PipeWire wrangling.",
  lang: "en-GB",
  base: process.env.DOCS_BASE ?? "/",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ["link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" }],
    ["meta", { name: "theme-color", content: "#0d9488" }],
  ],
  themeConfig: {
    logo: { src: "/logo.svg", alt: "" },
    nav: [
      { text: "Get started", link: "/guide/raspberry-pi" },
      { text: "Features", link: "/features/" },
      { text: "Snapcast", link: "/audio/snapcast" },
      { text: "Advanced", link: "/advanced/relay" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is Encore?", link: "/guide/what-is-encore" },
          { text: "Encore vs native Soloist", link: "/guide/why-encore" },
        ],
      },
      {
        text: "Setup",
        items: [
          { text: "Raspberry Pi & other boards", link: "/guide/raspberry-pi" },
          { text: "Soloist API key", link: "/guide/api-key" },
          { text: "First run & pairing", link: "/guide/first-run" },
          { text: "Other Linux & standalone", link: "/guide/other-installs" },
          { text: "Updating", link: "/guide/updating" },
        ],
      },
      {
        text: "Features",
        items: [
          { text: "Overview", link: "/features/" },
          { text: "Web console", link: "/features/console" },
          { text: "Lyrics overlay", link: "/features/lyrics" },
          { text: "Autoplay", link: "/features/autoplay" },
        ],
      },
      {
        text: "Audio",
        items: [
          { text: "Speakers & DACs", link: "/audio/outputs" },
          { text: "Snapcast server", link: "/audio/snapcast" },
          { text: "Sending to another Snapserver", link: "/audio/sending" },
        ],
      },
      {
        text: "Advanced",
        items: [
          { text: "WebSocket relay", link: "/advanced/relay" },
          { text: "Pusher & Laravel Reverb", link: "/advanced/pusher" },
          { text: "Webhooks", link: "/advanced/webhooks" },
          { text: "Control WebSocket", link: "/advanced/websocket" },
          { text: "HTTPS & reverse proxies", link: "/advanced/https" },
          { text: "Configuration file", link: "/advanced/configuration" },
        ],
      },
      { text: "FAQ", link: "/faq" },
    ],
    socialLinks: [{ icon: "github", link: repo }],
    editLink: { pattern: `${repo}/edit/develop/site/:path`, text: "Edit this page on GitHub" },
    search: { provider: "local" },
    outline: { level: [2, 3] },
    footer: {
      message: "MIT licensed. Encore wraps Spotify Soloist and is not affiliated with or endorsed by Spotify or Raspberry Pi Ltd.",
      copyright: "© 2026 Jessica Smith",
    },
  },
});
