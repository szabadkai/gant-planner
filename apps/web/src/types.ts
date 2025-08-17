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
  dependencies?: string | null; // JSON array of task IDs
  dueDate?: string | null; // ISO date string
  priority?: string | null; // HIGH, MEDIUM, LOW
  assignment?: Assignment | null;
};

export type Project = {
  id: ID;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: ID;
  email: string;
  name: string | null;
  projectTitle: string | null;
  currentProject: Project | null;
};
