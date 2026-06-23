import Input from "~/components/Input";

interface RoleItem {
  roleId: string;
  roleTitle: string;
  roleColor?: string | null;
}

export default function RoleField({ userRoles }: { userRoles: RoleItem[] }) {
  const label =
    userRoles.length > 0
      ? userRoles.map((r) => r.roleTitle).join(", ")
      : "Member";

  return (
    <Input className="max-w-sm" value={label} readOnly disabled type="text" />
  );
}
