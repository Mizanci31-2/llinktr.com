import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getProfileByUsername,
  getProfileByUserId,
  createProfile,
  updateProfile,
  getLinksByUserId,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
  recordLinkClick,
  getLinkClickCount,
  getLinkClicksByUserId,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Profile operations
  profile: router({
    getByUsername: publicProcedure
      .input(z.object({ username: z.string().min(1) }))
      .query(async ({ input }) => {
        const profile = await getProfileByUsername(input.username);
        return profile;
      }),

    getMe: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      return profile;
    }),

    create: protectedProcedure
      .input(
        z.object({
          username: z.string().min(3).max(50),
          bio: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if username is already taken
        const existing = await getProfileByUsername(input.username);
        if (existing) {
          throw new Error("Bu kullanıcı adı zaten alınmış");
        }

        const profile = await createProfile({
          userId: ctx.user.id,
          username: input.username,
          bio: input.bio,
        });

        return profile;
      }),

    update: protectedProcedure
      .input(
        z.object({
          username: z.string().min(3).max(50).optional(),
          bio: z.string().nullable().optional(),
          avatarUrl: z.string().nullable().optional(),
          avatarKey: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if new username is available
        if (input.username) {
          const existing = await getProfileByUsername(input.username);
          if (existing && existing.userId !== ctx.user.id) {
            throw new Error("Bu kullanıcı adı zaten alınmış");
          }
        }

        const profile = await updateProfile(ctx.user.id, input);
        return profile;
      }),
  }),

  // Link operations
  links: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const links = await getLinksByUserId(ctx.user.id);
      return links;
    }),

    getPublic: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const profile = await getProfileByUsername(input.username);
        if (!profile) return [];

        const links = await getLinksByUserId(profile.userId);
        return links;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          url: z.string().url(),
          order: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const link = await createLink({
          userId: ctx.user.id,
          title: input.title,
          url: input.url,
          order: input.order,
        });

        return link;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          title: z.string().min(1).max(255).optional(),
          url: z.string().url().optional(),
          order: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const link = await updateLink(input.id, ctx.user.id, {
          title: input.title,
          url: input.url,
          order: input.order,
        });

        if (!link) {
          throw new Error("Link bulunamadı veya güncellenemedi");
        }

        return link;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteLink(input.id, ctx.user.id);
        if (!success) {
          throw new Error("Link silinemedi");
        }
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({ linkIds: z.array(z.number().int()) }))
      .mutation(async ({ ctx, input }) => {
        await reorderLinks(ctx.user.id, input.linkIds);
        return { success: true };
      }),

    recordClick: publicProcedure
      .input(z.object({ linkId: z.number().int() }))
      .mutation(async ({ input }) => {
        await recordLinkClick(input.linkId);
        return { success: true };
      }),

    getClickCount: protectedProcedure
      .input(z.object({ linkId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const link = await getLinkById(input.linkId);
        if (!link || link.userId !== ctx.user.id) {
          throw new Error("Link bulunamadı");
        }

        const count = await getLinkClickCount(input.linkId);
        return { count };
      }),

    getClickStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getLinkClicksByUserId(ctx.user.id);
      return stats;
    }),
  }),
});

export type AppRouter = typeof appRouter;
