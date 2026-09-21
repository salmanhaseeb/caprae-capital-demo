// Public, fictional demo identities only. No interaction data belongs in this module.
export const demoOrganizations = [
  {
    id: "demo-org-acme",
    name: "Acme Software",
    users: [
      {
        id: "demo-user-acme-jordan",
        name: "Jordan Blake",
        email: "jordan@acme-software.example",
      },
      {
        id: "demo-user-acme-priya",
        name: "Priya Shah",
        email: "priya@acme-software.example",
      },
    ],
  },
  {
    id: "demo-org-beta",
    name: "Beta Holdings",
    users: [
      {
        id: "demo-user-beta-morgan",
        name: "Morgan Ellis",
        email: "morgan@beta-holdings.example",
      },
      {
        id: "demo-user-beta-alex",
        name: "Alex Rivera",
        email: "alex@beta-holdings.example",
      },
    ],
  },
];
export type DemoSession = { userId: string; organizationId: string };
