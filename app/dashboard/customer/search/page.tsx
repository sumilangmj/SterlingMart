import { RoleSectionPage } from "@/components/dashboard/role-section-page";

type SearchRouteProps = { searchParams: Promise<{ q?: string }> };

export default async function CustomerSearchRoute({ searchParams }: SearchRouteProps) {
  const { q = "" } = await searchParams;
  return <RoleSectionPage role="customer" section="search" query={q} />;
}
