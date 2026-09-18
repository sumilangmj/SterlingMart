import { RoleSectionPage } from "@/components/dashboard/role-section-page";

type SearchRouteProps = { searchParams: Promise<{ q?: string }> };

export default async function AdminSearchRoute({ searchParams }: SearchRouteProps) {
  const { q = "" } = await searchParams;
  return <RoleSectionPage role="admin" section="search" query={q} />;
}
