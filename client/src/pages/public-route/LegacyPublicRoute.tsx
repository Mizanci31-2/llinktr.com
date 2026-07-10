import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import PublicProfile from "@/pages/public-profile/PublicProfile";
import PublicBioPage from "@/pages/public-bio/PublicBioPage";
import { useParams } from "wouter";

export default function LegacyPublicRoute() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const profileQuery = trpc.profile.getByUsername.useQuery(
    { username: slug },
    {
      enabled: !!slug,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  );

  if (!slug) {
    return <PublicBioPage slug="" />;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (profileQuery.data) {
    return <PublicProfile username={slug} />;
  }

  return <PublicBioPage slug={slug} />;
}
