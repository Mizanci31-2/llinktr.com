import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import MondiadNativeAd from "@/components/MondiadNativeAd";

export default function PublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username || "";

  const profileQuery = trpc.profile.getByUsername.useQuery(
    { username },
    {
      enabled: !!username,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const linksQuery = trpc.links.getPublic.useQuery(
    { username },
    {
      enabled: !!username,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const profileData = profileQuery.data;
  const links = linksQuery.data || [];
  const loading = profileQuery.isLoading || linksQuery.isLoading;

  const handleLinkClick = async (linkId: number) => {
    try {
      await trpc.links.recordClick.mutate({ linkId });
    } catch (error) {
      console.error("Click recording failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Profil Bulunamadı</h1>
          <p className="text-slate-600">Bu kullanıcı adı ile bir profil bulunamadı.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <MondiadNativeAd compact className="mb-8" />

      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          {profileData.avatarUrl && (
            <img
              src={profileData.avatarUrl}
              alt={profileData.username}
              className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
            />
          )}

          <h1 className="mb-2 text-3xl font-bold text-slate-900">@{profileData.username}</h1>

          {profileData.bio && (
            <p className="mb-6 text-center text-slate-600">{profileData.bio}</p>
          )}
        </div>

        <div className="mb-8 space-y-3">
          {links.length > 0 ? (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
              >
                <Card className="link-card cursor-pointer p-4 transition-shadow hover:shadow-lg group">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="link-title font-semibold text-slate-900 transition group-hover:text-blue-600">
                        {link.title}
                      </h3>
                      <p className="truncate text-sm text-slate-500">{new URL(link.url).hostname}</p>
                    </div>
                    <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:text-blue-600" />
                  </div>
                </Card>
              </a>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-slate-600">Henüz link eklenmemiş.</p>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Powered by llinktr</p>
        </div>
      </div>

      <MondiadNativeAd compact className="mt-8" />
    </div>
  );
}
