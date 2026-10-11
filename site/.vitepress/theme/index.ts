import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import HomeHero from "./HomeHero.vue";
import HomeSteps from "./HomeSteps.vue";
import HomeFeatures from "./HomeFeatures.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("HomeHero", HomeHero);
    app.component("HomeSteps", HomeSteps);
    app.component("HomeFeatures", HomeFeatures);
  },
} satisfies Theme;
