export type ID = string;

export type Staff = {
  id: ID;
  name: string;
};

export type Assignment = {
  staffId: ID | null;
  position: string; // prisma Decimal
};

export type Task = {
  id: ID;
  name: string;
  mandays: number;
  jiraUrl?: string | null;
  theme?: string | null;
  assignment?: Assignment | null;
};

