import { RoleSectionPage } from "@/components/dashboard/role-section-page";

type SearchRouteProps = { searchParams: Promise<{ q?: string }> };

export default async function StaffSearchRoute({ searchParams }: SearchRouteProps) {
  const { q = "" } = await searchParams;
  return <RoleSectionPage role="staff" section="search" query={q} />;
}
