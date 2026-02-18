<script setup lang="ts">
import { useDisplay } from "vuetify";

const appConfig = useAppConfig();
const route = useRoute();
const { mdAndDown } = useDisplay();

const drawer = ref(!mdAndDown.value);
const rail = ref(false);
const openedGroups = ref<string[]>([]);
const isRailMode = computed(() => rail.value && !mdAndDown.value);

type NavLeaf = {
  title: string;
  icon: string;
  to: string;
};

type NavGroup = {
  title: string;
  icon: string;
  children: NavLeaf[];
};

type NavEntry = NavLeaf | NavGroup;

type NavSection = {
  title: string;
  items: NavEntry[];
};

const navSections = [
  {
    title: "Dashboards",
    items: [
      { title: "Dashboard", icon: "mdi-view-dashboard-outline", to: "/" },
      {
        title: "Members",
        icon: "mdi-account-group-outline",
        children: [
          {
            title: "All Members",
            icon: "mdi-account-multiple-outline",
            to: "/members",
          },
          {
            title: "Member Groups",
            icon: "mdi-account-supervisor-outline",
            to: "/members/groups",
          },
        ],
      },
      {
        title: "Savings",
        icon: "mdi-piggy-bank-outline",
        children: [
          {
            title: "Savings Ledger",
            icon: "mdi-book-open-variant-outline",
            to: "/savings",
          },
          {
            title: "Transactions",
            icon: "mdi-swap-horizontal",
            to: "/savings/transactions",
          },
        ],
      },
      {
        title: "Loans",
        icon: "mdi-cash-multiple",
        children: [
          { title: "Loan Portfolio", icon: "mdi-cash-check", to: "/loans" },
          {
            title: "Applications",
            icon: "mdi-file-document-outline",
            to: "/loans/applications",
          },
        ],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Reports", icon: "mdi-chart-box-outline", to: "/reports" },
      { title: "Settings", icon: "mdi-cog-outline", to: "/settings" },
    ],
  },
] satisfies NavSection[];

const navItems = computed(() => navSections.flatMap((s) => s.items));

const isNavGroup = (item: NavEntry): item is NavGroup => "children" in item;

const isGroupActive = (item: NavGroup) =>
  item.children.some(
    (child) => route.path === child.to || route.path.startsWith(`${child.to}/`),
  );

const isLeafActive = (item: NavLeaf) =>
  route.path === item.to || route.path.startsWith(`${item.to}/`);

const getGroupPrimaryRoute = (item: NavGroup) => {
  const activeChild = item.children.find((child) => isLeafActive(child));
  return activeChild?.to ?? item.children[0]?.to ?? "/";
};

const sectionTitle = computed(() => {
  for (const item of navItems.value) {
    if (!isNavGroup(item) && isLeafActive(item)) return item.title;

    if (isNavGroup(item)) {
      const match = item.children.find((child) => isLeafActive(child));
      if (match) return `${item.title} / ${match.title}`;
    }
  }
  return "Workspace";
});

const routeLabels = computed(() => {
  const labels = new Map<string, string>();
  labels.set("/", "Dashboard");

  for (const item of navItems.value) {
    if (isNavGroup(item)) {
      for (const child of item.children) labels.set(child.to, child.title);
      continue;
    }
    labels.set(item.to, item.title);
  }
  return labels;
});

const breadcrumbs = computed(() => {
  const pathParts = route.path.split("/").filter(Boolean);
  const trail = [{ title: "Dashboard", disabled: route.path === "/", to: "/" }];
  let currentPath = "";

  for (const part of pathParts) {
    currentPath += `/${part}`;
    const label = routeLabels.value.get(currentPath) ?? part.replace(/-/g, " ");
    trail.push({
      title: label,
      disabled: currentPath === route.path,
      to: currentPath,
    });
  }

  return trail;
});

watchEffect(() => {
  const activeGroups = navItems.value
    .filter(isNavGroup)
    .filter(isGroupActive)
    .map((g) => g.title);

  openedGroups.value = Array.from(
    new Set([...openedGroups.value, ...activeGroups]),
  );
});

watch(mdAndDown, (isSmall) => {
  drawer.value = !isSmall;
  rail.value = false;
});

watch(isRailMode, (enabled) => {
  if (enabled) openedGroups.value = [];
});

watch(
  () => route.path,
  () => {
    if (mdAndDown.value) drawer.value = false;
  },
);

watch(
  () => route.fullPath,
  () => {
    const activeGroups = navItems.value
      .filter(isNavGroup)
      .filter(isGroupActive)
      .map((g) => g.title);

    openedGroups.value = activeGroups; // only keep active group open

    if (mdAndDown.value) {
      drawer.value = false;
    }
  },
  { immediate: true },
);

const currentYear = new Date().getFullYear();
const searchQuery = ref("");
</script>

<template>
  <v-layout class="app-shell">
    <!-- Top bar (keep your theme colors) -->
    <v-app-bar
      color="primary"
      class="app-bar px-2"
      density="comfortable"
      height="64"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <div class="title-block">
        <p class="title-kicker">NuxtVuetify Template</p>
        <p class="title-main">{{ sectionTitle }}</p>
      </div>

      <v-spacer />

      <div class="top-search">
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          rounded="lg"
          hide-details
          placeholder="Search"
          prepend-inner-icon="mdi-magnify"
          class="search-field"
        />
      </div>

      <template #append>
        <v-btn icon="mdi-cog-outline" variant="text" />
        <v-badge
          color="accent"
          content="3"
          offset-x="4"
          offset-y="6"
          class="ml-2"
        >
          <v-btn icon="mdi-bell-outline" variant="text" />
        </v-badge>

        <v-chip class="ml-2" color="secondary" label size="small">Admin</v-chip>

        <!-- <v-btn
          v-if="!mdAndDown"
          class="ml-2"
          :icon="
            isRailMode ? 'mdi-arrow-expand-right' : 'mdi-arrow-collapse-left'
          "
          variant="text"
          @click="rail = !rail"
        /> -->
      </template>
    </v-app-bar>

    <!-- Sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      :width="284"
      :rail="isRailMode"
      :temporary="mdAndDown"
      rail-width="78"
      mobile-breakpoint="md"
      class="sidebar"
    >
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo">
          <v-icon icon="mdi-bank-outline" size="22" />
        </div>

        <div v-if="!isRailMode" class="brand-text">
          <div class="brand-title">{{ appConfig.title }}</div>
          <div class="brand-sub">Cooperative Finance</div>
        </div>
      </div>

      <!-- Navigation -->
      <v-list
        v-model:opened="openedGroups"
        nav
        density="comfortable"
        class="sidebar-list"
      >
        <template v-for="section in navSections" :key="section.title">
          <div v-if="!isRailMode" class="sidebar-section-title">
            {{ section.title }}
          </div>

          <template v-for="item in section.items" :key="item.title">
            <!-- RAIL: groups become a single item (primary route) -->
            <v-tooltip v-if="isRailMode && isNavGroup(item)" location="right">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :to="getGroupPrimaryRoute(item)"
                  :prepend-icon="item.icon"
                  rounded="xl"
                  class="nav-item"
                  :active="isGroupActive(item)"
                  active-class="nav-item--active"
                />
              </template>
              <span>{{ item.title }}</span>
            </v-tooltip>

            <!-- GROUP -->
            <v-list-group
              v-else-if="isNavGroup(item)"
              :value="item.title"
              class="sidebar-group"
            >
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :prepend-icon="item.icon"
                  :title="item.title"
                  rounded="xl"
                  class="nav-item"
                  :active="isGroupActive(item)"
                  active-class="nav-item--active"
                >
                  <template #append>
                    <v-icon icon="mdi-chevron-down" class="group-chevron" />
                  </template>
                </v-list-item>
              </template>

              <!-- KEY: Use v-list so Vuetify structure is consistent -->
              <v-list class="sub-list" density="compact" nav>
                <v-list-item
                  v-for="child in item.children"
                  :key="child.to"
                  :to="child.to"
                  :title="child.title"
                  rounded="xl"
                  class="sub-item"
                  :active="isLeafActive(child)"
                  active-class="sub-item--active"
                >
                  <template #prepend>
                    <v-icon :icon="child.icon" size="18" class="sub-icon" />
                  </template>
                </v-list-item>
              </v-list>
            </v-list-group>

            <!-- LEAF -->
            <v-tooltip v-else-if="isRailMode" location="right">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :to="item.to"
                  :prepend-icon="item.icon"
                  rounded="xl"
                  class="nav-item"
                  :active="isLeafActive(item)"
                  active-class="nav-item--active"
                />
              </template>
              <span>{{ item.title }}</span>
            </v-tooltip>

            <v-list-item
              v-else
              :to="item.to"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="xl"
              class="nav-item"
              :active="isLeafActive(item)"
              active-class="nav-item--active"
            />
          </template>

          <div class="sidebar-section-spacer" />
        </template>
      </v-list>

      <!-- Bottom collapse -->
      <!-- <div class="sidebar-bottom" v-if="!mdAndDown">
        <v-btn
          variant="text"
          class="collapse-btn"
          :icon="
            isRailMode ? 'mdi-arrow-expand-right' : 'mdi-arrow-collapse-left'
          "
          @click="rail = !rail"
        />
      </div> -->
    </v-navigation-drawer>

    <!-- Main -->
    <v-main class="content-area">
      <v-container class="py-6 content-wrap" fluid>
        <v-breadcrumbs :items="breadcrumbs" class="px-0 pt-0 breadcrumbs" />
        <slot />
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app border class="px-4 py-2 footer-bar">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="footer-copy">{{ appConfig.title }}</span>
        <span class="footer-copy">v0.1 • {{ currentYear }}</span>
      </div>
    </v-footer>
  </v-layout>
</template>

<style scoped>
/* Base */
.app-shell {
  min-height: 100vh;
}

.app-bar {
  backdrop-filter: blur(4px);
}

.title-block {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.title-kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  opacity: 0.9;
  text-transform: uppercase;
}

.title-main {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.top-search {
  width: min(520px, 46vw);
  margin-right: 0.25rem;
}

.search-field :deep(.v-field) {
  background: rgba(255, 255, 255, 0.14);
}

.search-field :deep(.v-field__outline) {
  opacity: 0.35;
}

/* Sidebar */
.sidebar {
  background: rgba(var(--v-theme-surface), 1);
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 14px 12px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-background), 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 8px 18px rgba(var(--v-theme-on-surface), 0.08);
}

.brand-title {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.brand-sub {
  font-size: 0.72rem;
  opacity: 0.7;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Section labels */
.sidebar-section-title {
  padding: 14px 16px 8px;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.58;
}

.sidebar-section-spacer {
  height: 10px;
}

/* List spacing */
.sidebar-list :deep(.v-list-item) {
  margin: 4px 10px;
}

/* Primary items */
.nav-item {
  height: 44px;
  border-radius: 14px;
}

.nav-item :deep(.v-list-item-title) {
  font-size: 0.92rem;
  font-weight: 600;
  opacity: 0.84;
}

.nav-item :deep(.v-list-item__prepend) {
  min-width: 34px;
  opacity: 0.72;
}

.nav-item:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

/* Active pill */
.nav-item--active {
  background: rgba(var(--v-theme-primary), 1) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow: 0 12px 22px rgba(var(--v-theme-primary), 0.24);
}

.nav-item--active :deep(.v-icon),
.nav-item--active :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-on-primary)) !important;
  opacity: 1 !important;
}

/* GROUP: kill Vuetify indentation (the golden fix) */
.sidebar-group :deep(.v-list-group__items) {
  padding-inline-start: 0 !important;
  margin-inline-start: 0 !important;
}

/* Chevron */
.group-chevron {
  opacity: 0.55;
}

/* Sub list wrapper (creates the nice guideline + compact indent) */
.sub-list {
  margin: 2px 10px 8px 10px !important;
  padding: 0 !important;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Sub items: pulled left (no wasted space) */
.sub-item {
  height: 40px;
  border-radius: 12px;
  margin: 4px 0 4px 6px !important; /* distance from guideline */
}

/* Override internal padding that causes "free space" */
.sub-item:deep(.v-list-item) {
  padding-inline-start: 10px !important;
  padding-inline-end: 12px !important;
}

.sub-item :deep(.v-list-item__content) {
  padding-inline-start: 0 !important;
}

.sub-item :deep(.v-list-item__prepend) {
  min-width: 26px !important;
  margin-inline-end: 8px !important;
}

.sub-icon {
  opacity: 0.65;
}

.sub-item:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

/* Active sub item */
.sub-item--active {
  background: rgba(var(--v-theme-primary), 0.12) !important;
}

.sub-item--active :deep(.v-list-item-title),
.sub-item--active :deep(.v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
  opacity: 1 !important;
}

/* Bottom collapse */
.sidebar-bottom {
  position: sticky;
  bottom: 0;
  padding: 10px 12px 12px;
  background: linear-gradient(
    to top,
    rgba(var(--v-theme-surface), 1) 70%,
    rgba(var(--v-theme-surface), 0)
  );
}

.collapse-btn {
  width: 100%;
  border-radius: 14px;
  background: rgba(var(--v-theme-background), 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Main background */
.content-area {
  background: rgb(var(--v-theme-background));
  background-image:
    radial-gradient(
      circle at 2px 2px,
      rgba(var(--v-theme-primary), 0.08) 1px,
      transparent 0
    ),
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.02),
      rgba(var(--v-theme-background), 0)
    );
  background-size:
    24px 24px,
    100% 100%;
}

.content-wrap {
  max-width: 1320px;
}

.breadcrumbs {
  opacity: 0.86;
}

/* Footer */
.footer-bar {
  backdrop-filter: blur(6px);
}

.footer-copy {
  font-size: 0.8rem;
  opacity: 0.86;
}
</style>
