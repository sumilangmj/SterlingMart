import { RoleSectionPage } from "@/components/dashboard/role-section-page";

type SearchRouteProps = { searchParams: Promise<{ q?: string }> };

export default async function VendorSearchRoute({ searchParams }: SearchRouteProps) {
  const { q = "" } = await searchParams;
  return <RoleSectionPage role="vendor" section="search" query={q} />;
}
