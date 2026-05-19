import Type from "typebox";
import { DuoLimitationCodedSchema } from "../business/services/consent/duo/duo-schemas";
import { CodingSchema } from "./schemas-coding";
import { Nullable, StringUnion, TypeDate } from "./typebox-helpers";

export const ReleaseSummarySchema = Type.Object({
  // the primary public identifier for this release
  releaseKey: Type.String(),

  // the date time of last change to anything in this release
  lastUpdatedDateTime: TypeDate,
  lastUpdatedUserSubjectId: Type.String(),

  // details of the DAC this release was created from
  applicationDacIdentifierSystem: Type.String(),
  applicationDacIdentifierValue: Type.String(),
  applicationDacTitle: Type.String(),

  // if this release has been activated for allowing actual data sharing activity
  isActivated: Type.Boolean(),

  // if a job is running then this is the percent it is complete - this info will
  // only appear if the caller is an administrator in the release
  isRunningJobPercentDone: Type.Optional(Type.Number()),
  isRunningJobBadge: Type.Optional(Type.String()),

  // the role the caller has in this particular release
  roleInRelease: Type.String(),
});

export type ReleaseSummaryType = Type.Static<typeof ReleaseSummarySchema>;

/**
 * An enum type for participant roles in the release
 */
export const ReleaseParticipantRoleConst = [
  "AdminView",
  "Administrator",
  "Manager",
  "Member",
] as const;
export type ReleaseParticipantRoleType =
  (typeof ReleaseParticipantRoleConst)[number];
export const ReleaseParticipantRole: ReleaseParticipantRoleType[] = [
  "AdminView",
  "Administrator",
  "Manager",
  "Member",
];

// seems like there is a bug in the Typebox union stuff - so have had to add this
// literal repetition (as opposed to the broken StringUnion)
export const TempReleaseParticipantRole = Type.Union([
  Type.Literal("AdminView"),
  Type.Literal("Administrator"),
  Type.Literal("Manager"),
  Type.Literal("Member"),
]);

export const ReleaseApplicationCodedTypeSchema = StringUnion([
  "HMB",
  "DS",
  "CC",
  "GRU",
  "POA",
]);

export const ReleaseApplicationCodedSchema = Type.Object({
  type: ReleaseApplicationCodedTypeSchema,

  isNonCommercial: Type.Boolean(),

  diseases: Type.Array(CodingSchema),

  countriesInvolved: Type.Array(CodingSchema),

  beaconQuery: Type.Any(),
});

export const ReleaseRunningJobSchema = Type.Object({
  percentDone: Type.Number(),
  messages: Type.Array(Type.String()),
  requestedCancellation: Type.Boolean(),
});

export const ReleaseActivationSchema = Type.Object({
  activatedByDisplayName: Type.String(),
});

export const DataSharingAwsAccessPointSchema = Type.Optional(
  Type.Object({
    name: Type.String(),
    accountId: Type.String(),
    vpcId: Type.String(),
    installed: Type.Boolean(),
    installedStackArn: Type.Optional(Type.String()),
  }),
);

export type DataSharingAwsAccessPointType = Type.Static<
  typeof DataSharingAwsAccessPointSchema
>;

export const DataSharingHtsgetAwsVpcLatticeAccessPointSchema = Type.Optional(
  Type.Object({
    name: Type.String(),
    accountId: Type.String(),
    vpcId: Type.String(),
    installed: Type.Boolean(),
    installedStackArn: Type.Optional(Type.String()),
  }),
);

export type DataSharingHtsgetAwsVpcLatticeAccessPointType = Type.Static<
  typeof DataSharingHtsgetAwsVpcLatticeAccessPointSchema
>;

export const DataSharingGlobusSchema = Type.Optional(
  Type.Object({
    installed: Type.Boolean(),
    // TODO: Add Group Ids here??
  }),
);

export type DataSharingGlobusType = Type.Static<typeof DataSharingGlobusSchema>;

export const ReleaseDetailSchema = Type.Object({
  id: Type.String(),

  roleInRelease: TempReleaseParticipantRole,
  //Type.Union(
  //  ReleaseParticipantRole.map((r: ReleaseParticipantRoleType) =>
  //    Type.Literal(r),
  //  ),
  //),

  lastUpdatedDateTime: TypeDate,
  lastUpdatedUserSubjectId: Type.String(),

  datasetUris: Type.Array(Type.String()),

  applicationDacIdentifier: Type.Optional(Type.String()),
  applicationDacTitle: Type.Optional(Type.String()),
  applicationDacDetails: Type.Optional(Type.String()),

  // the number of cases visible to whoever makes this call - for administrators this will always
  // be *all* cases, for others it will only be those available to them
  visibleCasesCount: Type.Integer(),

  applicationCoded: ReleaseApplicationCodedSchema,

  // which categories of data are allowed to be shared

  // by type
  isAllowedReadData: Type.Boolean(),
  isAllowedVariantData: Type.Boolean(),
  isAllowedPhenotypeData: Type.Boolean(),

  // by location
  isAllowedS3Data: Type.Boolean(),
  isAllowedGSData: Type.Boolean(),
  isAllowedR2Data: Type.Boolean(),
  isAllowedNciGlobusData: Type.Boolean(),

  // Permission for the current user that allowed to edit other user's role within the release.
  rolesAllowedToAlterParticipant: Nullable(
    Type.Array(TempReleaseParticipantRole),
  ),

  // if present, means that this release has been activated for data sharing
  activation: Type.Optional(ReleaseActivationSchema),

  // if present, means that this release is in the process of running a background job
  runningJob: Type.Optional(ReleaseRunningJobSchema),

  permissionViewSelections: Type.Optional(Type.Boolean()),
  permissionEditSelections: Type.Optional(Type.Boolean()),
  permissionEditApplicationCoded: Type.Optional(Type.Boolean()),
  permissionAccessData: Type.Optional(Type.Boolean()),

  // if enabled by the data custodian AND as a feature, this structure is present.. if not, it is not
  dataSharingObjectSigning: Type.Optional(
    Type.Object({
      expiryHours: Type.Integer(),
    }),
  ),

  dataSharingHtsgetRestrictions: Type.Array(Type.String()),

  // if enabled by the data custodian AND as a feature, this structure is present, else not
  dataSharingCopyOut: Type.Optional(
    Type.Object({
      destinationLocation: Type.String(),
    }),
  ),

  // if enabled by the data custodian AND as a feature, this structure is present, else not
  dataSharingHtsget: Type.Optional(
    Type.Object({
      url: Type.String(),
    }),
  ),

  // if enabled by the data custodian AND as a feature, this structure is present, else not
  dataSharingAwsAccessPoint: DataSharingAwsAccessPointSchema,

  // if enabled by the data custodian AND as a feature, this structure is present, else not
  dataSharingHtsgetAwsVpcLatticeAccessPoint:
    DataSharingHtsgetAwsVpcLatticeAccessPointSchema,

  // if enabled by the data custodian AND as a feature, this structure is present, else not
  dataSharingGcpStorageIam: Type.Optional(
    Type.Object({
      users: Type.Array(Type.String()),
    }),
  ),

  dataSharingGlobus: DataSharingGlobusSchema,

  // once we get @role link properties working we should enable this
  // roleInRelease: Type.String(),
});

export const ReleaseNodeStatusSchema = StringUnion([
  "selected",
  "indeterminate",
  "unselected",
]);

export const ConsentStatementDuoSchema = Type.Object({
  type: Type.Literal("consent::ConsentStatementDuo"), // note this is exposing the underlying Gel type

  dataUseLimitation: DuoLimitationCodedSchema,
});

export const ConsentStatementDynamicDuoSchema = Type.Object({
  type: Type.Literal("consent::ConsentStatementDynamicDuo"), // note this is exposing the underlying Gel type

  consentSystemIdentifier: Type.String(),
});

export const ConsentStatementSchema = Type.Union([
  ConsentStatementDuoSchema,
  ConsentStatementDynamicDuoSchema,
]);

export const ReleaseSpecimenSchema = Type.Object({
  id: Type.String(),
  externalId: Type.String(), // TODO: fix this
  // the node status of whether this specimen is released
  nodeStatus: ReleaseNodeStatusSchema,
  // whether there is specimen specific consent statements
  consentStatements: Type.Optional(Type.Array(ConsentStatementSchema)),
  customConsent: Type.Boolean(),
});

export const ReleasePatientBirthSexSchema = StringUnion([
  "male",
  "female",
  "other",
]);

export const ReleasePatientSchema = Type.Object({
  id: Type.String(),

  externalId: Type.String(),
  externalIdSystem: Type.String(),

  searchMatchExternalId: Type.Optional(Type.String()),
  searchMatchExternalIdSystem: Type.Optional(Type.String()),

  sexAtBirth: Type.Optional(ReleasePatientBirthSexSchema),

  specimens: Type.Array(ReleaseSpecimenSchema),

  // the node status of whether this patient is released
  nodeStatus: ReleaseNodeStatusSchema,
  // whether there is patient specific consent statements
  consentStatements: Type.Optional(Type.Array(ConsentStatementSchema)),
  customConsent: Type.Boolean(),
});

export const ReleaseCaseSchema = Type.Object({
  id: Type.String(),

  externalId: Type.String(), // TODO: fix this
  externalIdSystem: Type.String(),

  patients: Type.Array(ReleasePatientSchema),
  // both of these identifiers are possibly useful - lets work out which is most useful
  fromDatasetUri: Type.String(),
  fromDatasetId: Type.String(),
  // the node status of whether this case is released
  nodeStatus: ReleaseNodeStatusSchema,

  consentStatements: Type.Optional(Type.Array(ConsentStatementSchema)),
  // whether there is case specific consent statements
  customConsent: Type.Boolean(),
});

export const ReleasePreviousJobSchema = Type.Object({
  objectId: Type.String(),
  type: Type.String(),
  created: Type.Optional(TypeDate),
  started: Type.Optional(TypeDate),
  ended: Type.Optional(TypeDate),
  requestedCancellation: Type.Boolean(),
  details: Type.String(),
});
export type ReleasePreviousJobType = Type.Static<
  typeof ReleasePreviousJobSchema
>;

// Schema for manually creating a release instead importing it from a DAC
export const ReleaseManualSchema = Type.Object({
  releaseTitle: Type.String(),
  releaseDescription: Type.String(),

  studyType: ReleaseApplicationCodedTypeSchema,

  datasetUris: Type.Array(Type.String()),
  applicantEmailAddresses: Type.String(),
});
export type ReleaseManualType = Type.Static<typeof ReleaseManualSchema>;

/**
 * A schema representing the participation of someone in a release.
 *
 * This schema is primarily for use by the release user management
 * user interface.
 */
export const ReleaseParticipantSchema = Type.Object({
  // the internal identifier (UUID) for this user
  id: Type.String(),
  email: Type.String(),
  // the role of this user in this release
  role: Nullable(StringUnion(ReleaseParticipantRole)),
  displayName: Nullable(Type.String()),
  subjectId: Nullable(Type.String()),
  // the last login datetime or null if this user has never logged in
  lastLogin: Type.Optional(Nullable(TypeDate)),

  // is true if the person making the call has enough permissions to alter this particular record
  // this is the start of a pattern for how per release permissions can be relayed to the UI
  canBeRemoved: Type.Boolean(),
  canBeRoleAltered: Type.Boolean(),
  // The role options for that participant from the logged in user
  roleAlterOptions: Nullable(Type.Array(StringUnion(ReleaseParticipantRole))),
});
export type ReleaseParticipantType = Type.Static<
  typeof ReleaseParticipantSchema
>;

/**
 * A schema representing the operation to add a user to a release with
 * a specific role.
 */
export const ReleaseParticipantAddSchema = Type.Object({
  email: Type.String(),
  role: Type.String(),
});
export type ReleaseParticipantAddType = Type.Static<
  typeof ReleaseParticipantAddSchema
>;

export type ReleaseNodeStatusType = Type.Static<typeof ReleaseNodeStatusSchema>;

export type ReleaseSpecimenType = Type.Static<typeof ReleaseSpecimenSchema>;
export type ReleasePatientType = Type.Static<typeof ReleasePatientSchema>;
export type ReleaseCaseType = Type.Static<typeof ReleaseCaseSchema>;

export type ReleaseDetailType = Type.Static<typeof ReleaseDetailSchema>;

export type ConsentStatementType = Type.Static<typeof ConsentStatementSchema>;
export type ConsentStatementDuoType = Type.Static<
  typeof ConsentStatementDuoSchema
>;
export type ConsentStatementDynamicDuoType = Type.Static<
  typeof ConsentStatementDynamicDuoSchema
>;
