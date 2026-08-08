export const routes = {
  public: {
    home: "/",
    projects: "/projects",
    bookViewing: "/book-viewing",
    contact: "/contact",
    about: "/about",
    account: "/account",
  },

  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },

  admin: {
    dashboard: "/admin",
    imports: "/admin/imports",
    users: "/admin/users",
    agents: "/admin/agents",
    projects: "/admin/projects",
    properties: "/admin/properties",
    leads: "/admin/leads",
    bookings: "/admin/bookings",
    customers: "/admin/customers",
    documents: "/admin/documents",
    appointments: "/admin/appointments",
    reports: "/admin/reports",
    settings: "/admin/settings",
  },

  agent: {
    dashboard: "/agent",
    leads: "/agent/leads",
    bookings: "/agent/bookings",
    customers: "/agent/customers",
    documents: "/agent/documents",
    appointments: "/agent/appointments",
    profile: "/agent/profile",
  },
} as const;
