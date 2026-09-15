import { cookies } from "next/headers";
import AppChrome from "@/components/AppChrome";
import { getCurrentUser } from "@/lib/session";
import { availableWorkspaces, normalizeWorkspace } from "@/lib/workspace";
import SettingsPageHeader from "../SettingsPageHeader";
import WorkspaceForm from "./WorkspaceForm";

export default async function WorkspaceSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Workspace</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  const roles = user.systemRoles.map((role) => role.role);
  const workspace = normalizeWorkspace((await cookies()).get("fhc_workspace")?.value || user.selectedWorkspace, roles);

  return (
    <AppChrome>
      <div className="mx-auto max-w-xl">
        <SettingsPageHeader title="Workspace" />
        <WorkspaceForm workspaces={availableWorkspaces(roles)} activeWorkspace={workspace} />
      </div>
    </AppChrome>
  );
}
