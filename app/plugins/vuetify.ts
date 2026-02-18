import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin((nuxtApp) => {
  const appConfig = useAppConfig();
  const configuredColors = appConfig.theme?.colors ?? {};
  const configuredDarkColors = appConfig.theme?.darkColors ?? configuredColors;

  const vuetify = createVuetify({
    defaults: {
      global: {
        style: {
          fontFamily:
            '"Lexend", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      },
      VCard: {
        flat: true,
        elevation: 0,
        border: true,
        rounded: "lg",
      },
      VBtn: {
        flat: true,
        elevation: 0,
        rounded: "xl",
        border: true,
      },
      VSheet: {
        flat: true,
        elevation: 0,
        border: true,
      },
      VAppBar: {
        flat: true,
        elevation: 0,
        border: true,
      },
      VNavigationDrawer: {
        elevation: 0,
        border: true,
      },
      VFooter: {
        elevation: 0,
        border: true,
      },
    },

    theme: {
      defaultTheme: appConfig.theme?.dark ? "coInvestDark" : "coInvestLight",
      themes: {
        coInvestLight: {
          dark: false,
          colors: configuredColors,
        },
        coInvestDark: {
          dark: true,
          colors: configuredDarkColors,
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
