import { useRoute } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PublicProfile() {
  const [route, params] = useRoute("/:username");
  const [profileData, setProfileData] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const profileQuery = trpc.profile.getByUsername.useQuery(
    { username: params?.username || "" },
    { enabled: !!params?.username }
  );

  const linksQuery = trpc.links.getPublic.useQuery(
    { username: params?.username || "" },
    { enabled: !!params?.username }
  );

  useEffect(() => {
    if (profileQuery.data) {
      setProfileData(profileQuery.data);
    }
    if (linksQuery.data) {
      setLinks(linksQuery.data);
    }
    if (profileQuery.isLoading || linksQuery.isLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [profileQuery.data, profileQuery.isLoading, linksQuery.data, linksQuery.isLoading]);

  const handleLinkClick = async (linkId: number) => {
    try {
      await trpc.links.recordClick.mutate({ linkId });
    } catch (error) {
      console.error("Click recording failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profil Bulunamadı</h1>
          <p className="text-slate-600">Bu kullanıcı adı ile bir profil bulunamadı.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {profileData.avatarUrl && (
            <img
              src={profileData.avatarUrl}
              alt={profileData.username}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
            />
          )}

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            @{profileData.username}
          </h1>

          {profileData.bio && (
            <p className="text-slate-600 text-center mb-6">
              {profileData.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3 mb-8">
          {links.length > 0 ? (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {link.title}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {new URL(link.url).hostname}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition ml-2 flex-shrink-0" />
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

        {/* Ad Area */}
        <div className="bg-slate-200 rounded-lg p-6 text-center text-sm text-slate-600">
          <p>Reklam Alanı</p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <p>Powered by llinktr</p>
        </div>
      </div>
    </div>
  );
}
