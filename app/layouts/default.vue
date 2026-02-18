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

const navItems = computed(() =>
  navSections.flatMap((section) => section.items),
);

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
    if (!isNavGroup(item) && isLeafActive(item)) {
      return item.title;
    }

    if (isNavGroup(item)) {
      const match = item.children.find((child) => isLeafActive(child));
      if (match) {
        return `${item.title} / ${match.title}`;
      }
    }
  }

  return "Workspace";
});

const routeLabels = computed(() => {
  const labels = new Map<string, string>();
  labels.set("/", "Dashboard");

  for (const item of navItems.value) {
    if (isNavGroup(item)) {
      for (const child of item.children) {
        labels.set(child.to, child.title);
      }
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
    .map((group) => group.title);
  openedGroups.value = Array.from(
    new Set([...openedGroups.value, ...activeGroups]),
  );
});

watch(mdAndDown, (isSmall) => {
  drawer.value = !isSmall;
  rail.value = false;
});

watch(isRailMode, (enabled) => {
  if (enabled) {
    openedGroups.value = [];
  }
});

watch(
  () => route.path,
  () => {
    if (mdAndDown.value) {
      drawer.value = false;
    }
  },
);

const currentYear = new Date().getFullYear();
</script>

<template>
  <v-layout class="app-shell">
    <v-app-bar color="primary" class="app-bar px-2" density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <div class="title-block">
        <p class="title-kicker">SACCO Platform</p>
        <p class="title-main">{{ sectionTitle }}</p>
      </div>
      <template #append>
        <v-btn
          v-if="!mdAndDown"
          :icon="rail ? 'mdi-arrow-expand-right' : 'mdi-arrow-collapse-left'"
          variant="text"
          @click="rail = !rail"
        />
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
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      color="surface"
      :width="276"
      :rail="isRailMode"
      :temporary="mdAndDown"
      mobile-breakpoint="md"
      rail-width="72"
      class="sidebar"
    >
      <div class="brand-block">
        <v-avatar color="primary" size="36">
          <v-icon icon="mdi-bank-outline" />
        </v-avatar>
        <div v-if="!isRailMode" class="brand-copy">
          <p class="brand-title">{{ appConfig.title }}</p>
          <p class="brand-subtitle">Cooperative Finance</p>
        </div>
      </div>

      <v-list
        v-model:opened="openedGroups"
        class="pt-2 nav-list"
        density="comfortable"
        nav
      >
        <template v-for="section in navSections" :key="section.title">
          <v-list-subheader
            v-if="!isRailMode"
            class="text-uppercase section-label"
          >
            {{ section.title }}
          </v-list-subheader>

          <template v-for="item in section.items" :key="item.title">
            <v-list-item
              v-if="isRailMode && isNavGroup(item)"
              :to="getGroupPrimaryRoute(item)"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="lg"
              class="mb-1 nav-item rail-item"
              :active="isGroupActive(item)"
            />

            <v-list-group
              v-else-if="isNavGroup(item)"
              :value="item.title"
              class="mb-1 nav-group"
            >
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :prepend-icon="item.icon"
                  :title="item.title"
                  rounded="lg"
                  :active="isGroupActive(item)"
                  class="nav-item group-parent"
                  :class="{ 'group-parent-active': isGroupActive(item) }"
                />
              </template>

              <v-list-item
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                :prepend-icon="child.icon"
                :title="child.title"
                rounded="lg"
                class="mb-1 sub-item"
                :class="{ 'sub-item-active': isLeafActive(child) }"
                :active="isLeafActive(child)"
              />
            </v-list-group>

            <v-list-item
              v-else
              :to="item.to"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="lg"
              class="mb-1 nav-item"
              :class="{ 'nav-item-active': isLeafActive(item) }"
              :active="isLeafActive(item)"
            />
          </template>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main class="content-area">
      <v-container class="py-6 content-wrap" fluid>
        <v-breadcrumbs :items="breadcrumbs" class="px-0 pt-0" />
        <slot />
      </v-container>
    </v-main>

    <v-footer app border class="px-4 py-2 footer-bar">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="footer-copy">{{ appConfig.title }} SACCO</span>
        <span class="footer-copy"
          >Secure Cooperative Banking • {{ currentYear }}</span
        >
      </div>
    </v-footer>
  </v-layout>
</template>

<style scoped>
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
  opacity: 0.8;
  text-transform: uppercase;
}

.title-main {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.sidebar {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0.8rem 0.5rem;
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.2;
}

.brand-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-label {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  opacity: 0.62;
  padding-inline: 0.75rem;
}

.nav-list :deep(.v-list-item) {
  margin-inline: 0.25rem;
}

.nav-item :deep(.v-list-item-title) {
  font-weight: 500;
}

.nav-item :deep(.v-list-item__prepend) {
  min-width: 1.42rem;
  margin-inline-end: 0.56rem;
}

.nav-group {
  margin-bottom: 0.2rem;
}

.sub-item {
  margin-left: 0.2rem;
  padding-left: 0.2rem;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.sub-item :deep(.v-list-item-title) {
  font-size: 0.86rem;
  opacity: 0.9;
}

.sub-item :deep(.v-list-item__prepend) {
  min-width: 1.28rem;
  margin-inline-end: 0.52rem;
}

.group-parent-active {
  background: rgba(var(--v-theme-secondary), 0.14);
}

.group-parent-active :deep(.v-list-item-title),
.group-parent-active :deep(.v-list-item__prepend .v-icon) {
  color: rgb(var(--v-theme-secondary));
}

.sub-item-active {
  background: rgba(var(--v-theme-primary), 0.1);
}

.sub-item-active :deep(.v-list-item-title),
.sub-item-active :deep(.v-list-item__prepend .v-icon) {
  color: rgb(var(--v-theme-primary));
}

.nav-item-active {
  background: rgba(var(--v-theme-primary), 0.12);
}

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

.footer-bar {
  backdrop-filter: blur(6px);
}

.footer-copy {
  font-size: 0.8rem;
  opacity: 0.86;
}
</style>
