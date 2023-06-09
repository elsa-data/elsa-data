import { internalProcedure, router } from "../../trpc-bootstrap";
import { z } from "zod";
import {
  inputReleaseKey,
  inputReleaseKeySingle,
} from "../input-schemas-common";
import {
  ReleaseParticipantType,
  releaseParticipantRole,
} from "@umccr/elsa-types";

/**
 * RPC for release participants
 */

export const releaseParticipantRouter = router({
  getParticipants: internalProcedure
    .input(inputReleaseKeySingle)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey } = input;

      const participants = await ctx.releaseParticipantService.getParticipants(
        user,
        releaseKey
      );

      // note that participants in *not* paged because there is a natural limit to participants in a release
      return participants.map(
        (r): ReleaseParticipantType => ({
          id: r.id,
          email: r.email,
          role: r.role || "None",
          displayName: r.displayName || r.email,
          subjectId: r.subjectId || undefined,
          lastLogin: r.lastLogin || undefined,
          // WIP - also need to check permissions of authenticatedUser
          canBeRemoved: r.id !== user.dbId,
          canBeRoleAltered: r.id !== user.dbId,
        })
      );
    }),
  addParticipant: internalProcedure
    .input(
      z.object({
        releaseKey: inputReleaseKey,
        email: z.string(),
        role: z.enum(releaseParticipantRole),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, email, role } = input;

      return ctx.releaseParticipantService.addParticipant(
        user,
        releaseKey,
        email,
        role
      );
    }),

  removeParticipant: internalProcedure
    .input(
      z.object({
        releaseKey: inputReleaseKey,
        participantUuid: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { releaseKey, participantUuid } = input;

      return ctx.releaseParticipantService.removeParticipant(
        user,
        releaseKey,
        participantUuid
      );
    }),
});
