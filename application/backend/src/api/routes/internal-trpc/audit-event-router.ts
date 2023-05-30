import { z } from "zod";
import { internalProcedure, router } from "../trpc-bootstrap";
import {
  inputPaginationParameter,
  inputReleaseKeySingle,
} from "./input-schemas-common";
import { audit } from "../../../../dbschema/interfaces";
import _ from "lodash";
import AuditEvent = audit.AuditEvent;

/**
 * An object for the audit event filter type.
 */
export const inputFilter = z.object({
  filter: z.array(
    z.union([
      z.literal("release"),
      z.literal("user"),
      z.literal("system"),
      z.literal("all"),
    ])
  ),
});

/**
 * tRPC router for audit events
 */
export const auditEventRouter = router({
  getReleaseAuditEvent: internalProcedure
    .input(inputReleaseKeySingle.merge(inputPaginationParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;

      return (
        (await ctx.auditEventService.getReleaseEntries(
          user,
          input.releaseKey,
          pageSize,
          (input.page - 1) * pageSize,
          input.orderByProperty as keyof AuditEvent,
          input.orderAscending
        )) ?? { data: [], total: 0 }
      );
    }),
  getAuditEvent: internalProcedure
    .input(inputFilter.merge(inputPaginationParameter))
    .query(async ({ input, ctx }) => {
      const { user, pageSize } = ctx;

      return (
        (await ctx.auditEventService.getUserEntries(
          _.uniq(input.filter),
          user,
          pageSize,
          (input.page - 1) * pageSize,
          true,
          input.orderByProperty as keyof AuditEvent,
          input.orderAscending
        )) ?? { data: [], total: 0 }
      );
    }),
});
