export type Workspace = "MEMBER" | "SPEAKER" | "TRAINER" | "ADMIN";

export const workspaceOptions: Array<{ value: Workspace; label: string; description: string }> = [
  { value: "MEMBER", label: "Member View", description: "Kelas, event sendiri, feedback, materi, credit." },
  { value: "SPEAKER", label: "Speaker View", description: "Event dan feedback untuk penceramah." },
  { value: "TRAINER", label: "Trainer View", description: "Event dan feedback untuk trainer." },
  { value: "ADMIN", label: "Admin End", description: "Database, approval, event, attendance, feedback." },
];

export function availableWorkspaces(roles: string[]) {
  const result: Workspace[] = ["MEMBER"];
  if (roles.includes("SPEAKER")) result.push("SPEAKER");
  if (roles.includes("TRAINER")) result.push("TRAINER");
  if (roles.some((role) => ["SUPER_ADMIN", "ADMIN", "KETUA", "SUB_KETUA"].includes(role))) result.push("ADMIN");
  return result;
}

export function normalizeWorkspace(value: string | null | undefined, roles: string[]): Workspace {
  const available = availableWorkspaces(roles);
  return available.includes(value as Workspace) ? value as Workspace : available[0];
}
