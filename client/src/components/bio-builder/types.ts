export type BlockType =
  | "heading"
  | "description"
  | "text"
  | "link"
  | "social"
  | "location"
  | "divider"
  | "profile_image";

export interface LocalBlock {
  id?: number;
  tempId: string;
  type: BlockType;
  sortOrder: number;
  isEnabled: boolean;
  clicks?: number;
  data: Record<string, string | boolean | number>;
}

export interface PreviewPageData {
  title: string;
  description?: string | null;
  profileImageUrl?: string | null;
  customBackgroundImageUrl?: string | null;
  slug: string;
}

export interface SocialLinkDraft {
  id: string;
  tempId?: string;
  platform: string;
  url: string;
  isEnabled: boolean;
  clicks?: number;
}
