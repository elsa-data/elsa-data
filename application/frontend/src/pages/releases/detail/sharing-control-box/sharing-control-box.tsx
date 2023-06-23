import React, { PropsWithChildren, ReactNode, useState } from "react";
import classNames from "classnames";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Box } from "../../../../components/boxes";
import { ReleaseTypeLocal } from "../../shared-types";
import {
  LeftDiv,
  RhSection,
  RightDiv,
} from "../../../../components/rh/rh-structural";
import {
  RhCheckItem,
  RhChecks,
  RhChecksDetail,
} from "../../../../components/rh/rh-checks";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../../queries";
import { trpc } from "../../../../helpers/trpc";
import ReactMarkdown from "react-markdown";
import { useEnvRelay } from "../../../../providers/env-relay-provider";
import {
  FEATURE_DATA_SHARING_AWS_ACCESS_POINT,
  FEATURE_DATA_SHARING_COPY_OUT,
  FEATURE_DATA_SHARING_GCP_IAM,
  FEATURE_DATA_SHARING_HTSGET,
} from "@umccr/elsa-constants";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const SharingControlBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const { features } = useEnvRelay();
  const queryClient = useQueryClient();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      // whenever we do a mutation of application coded data - our API returns the complete updated
      // state of the *whole* release - and we can use that data to replace the stored react-query state
      onSuccess: (result: ReleaseTypeLocal) => {
        queryClient.setQueryData(
          REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
          result
        );
      },
    }
  );

  const [congenitalHeartDefect, setCongenitalHeartDefect] = useState(
    releaseData.htsgetRestrictions.includes("CongenitalHeartDefect")
  );
  const [autism, setAutism] = useState(
    releaseData.htsgetRestrictions.includes("Autism")
  );
  const [achromatopsia, setAchromatopsia] = useState(
    releaseData.htsgetRestrictions.includes("Achromatopsia")
  );

  const applyHtsgetRestriction =
    trpc.releaseRouter.applyHtsgetRestriction.useMutation();
  const removeHtsgetRestriction =
    trpc.releaseRouter.removeHtsgetRestriction.useMutation();

  const copyOutMutate = trpc.releaseJob.startCopyOut.useMutation({
    onSettled: async () =>
      queryClient.invalidateQueries(
        REACT_QUERY_RELEASE_KEYS.detail(releaseKey)
      ),
  });

  type SharingConfigurationAccordionProps = {
    label: ReactNode;
    path:
      | "/dataSharingConfiguration/objectSigningEnabled"
      | "/dataSharingConfiguration/copyOutEnabled"
      | "/dataSharingConfiguration/htsgetEnabled"
      | "/dataSharingConfiguration/awsAccessPointEnabled"
      | "/dataSharingConfiguration/gcpStorageIamEnabled";
    current: boolean;
  };
  const SharingConfigurationAccordion: React.FC<
    PropsWithChildren<SharingConfigurationAccordionProps>
  > = (props) => (
    <div
      tabIndex={0}
      className={classNames(
        "rounded-box collapse border border-base-300 bg-base-100",
        {
          "collapse-open": props.current,
          "collapse-close": !props.current,
        }
      )}
    >
      <div className="collapse-title text-xl font-medium">
        <div className={classNames("form-control", "items-start", "space-x-2")}>
          <label className="label cursor-pointer">
            <input
              type="checkbox"
              className={classNames(
                "checkbox-accent checkbox checkbox-sm mr-2",
                { "opacity-50": releasePatchMutate.isLoading }
              )}
              checked={props.current}
              onChange={(e) => {
                releasePatchMutate.mutate({
                  op: "replace",
                  path: props.path,
                  value: !props.current,
                });
              }}
            />
            <span className="label-text">{props.label}</span>
          </label>
        </div>
      </div>
      <div className="collapse-content flex flex-row">{props.children}</div>
    </div>
  );

  type HtsgetRestrictionProps = {
    label: ReactNode;
    restriction: "CongenitalHeartDefect" | "Autism" | "Achromatopsia";
    setFn: (restriction: boolean) => void;
    checked: boolean;
  };
  const HtsgetRestriction: React.FC<
    PropsWithChildren<HtsgetRestrictionProps>
  > = (props) => (
    <div className="form-control items-start font-medium">
      <label className="label cursor-pointer">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(e) => {
            props.setFn(e.target.checked);

            if (e.target.checked) {
              applyHtsgetRestriction.mutate({
                releaseKey,
                restriction: props.restriction,
              });
            } else {
              removeHtsgetRestriction.mutate({
                releaseKey,
                restriction: props.restriction,
              });
            }
          }}
          className={classNames("checkbox-accent checkbox checkbox-sm mr-2", {
            "opacity-50":
              applyHtsgetRestriction.isLoading ||
              removeHtsgetRestriction.isLoading,
          })}
        />
        <span className="label-text">{props.label}</span>
      </label>
    </div>
  );

  // NOTE the "enabled" fields are whether the custodian has checked the checkbox..
  // but there is also underlying "feature" fields that mean we should not show the UI at all
  const objectSigningEnabled = !!releaseData.dataSharingObjectSigning;
  const copyOutEnabled = !!releaseData.dataSharingCopyOut;
  const htsgetEnabled = !!releaseData.dataSharingHtsget;
  const awsAccessPointEnabled = !!releaseData.dataSharingAwsAccessPoint;
  const gcpStorageIamEnabled = !!releaseData.dataSharingGcpStorageIam;

  return (
    <Box heading="Data Sharing Control">
      <RhSection>
        <LeftDiv
          heading={"Mechanism"}
          extra={
            "The technical mechanisms by which data will be shared must be enabled " +
            "according to data transfer agreements and organisation policy"
          }
        />
        <RightDiv>
          <RhChecks label="Researcher Access Via">
            <SharingConfigurationAccordion
              path="/dataSharingConfiguration/objectSigningEnabled"
              label="Object Signing"
              current={objectSigningEnabled}
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Signing Expiry in Hours</span>
                </label>
                <input
                  type="text"
                  className="input-bordered input w-full"
                  defaultValue={releaseData.dataSharingObjectSigning?.expiryHours.toString()}
                  onBlur={(e) =>
                    releasePatchMutate.mutate({
                      op: "replace",
                      path: "/dataSharingConfiguration/objectSigningExpiryHours",
                      value: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </SharingConfigurationAccordion>

            {features.has(FEATURE_DATA_SHARING_COPY_OUT) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/copyOutEnabled"
                label="Copy Out"
                current={copyOutEnabled}
              >
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Destination for Copy Out</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={
                      releaseData.dataSharingCopyOut?.destinationLocation
                    }
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Start a Background Copy</span>
                    <span className="label-text-alt">
                      (running time can be hours)
                    </span>
                  </label>
                  <button
                    type="button"
                    className="btn-normal"
                    onClick={() => {
                      copyOutMutate.mutate({
                        releaseKey: releaseKey,
                        destinationBucket:
                          releaseData.dataSharingCopyOut?.destinationLocation ||
                          "",
                      });
                    }}
                    disabled={copyOutMutate.isLoading}
                  >
                    Copy Out
                  </button>
                </div>
              </SharingConfigurationAccordion>
            )}

            {features.has(FEATURE_DATA_SHARING_HTSGET) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/htsgetEnabled"
                label="Htsget"
                current={htsgetEnabled}
              >
                <div className="flex flex-col">
                  <div className={"pb-2"}>
                    htsget is a protocol that allows restricting data sharing to
                    specific regions.
                  </div>
                  <pre className="pb-4">
                    {releaseData.dataSharingHtsget?.url}
                  </pre>

                  <div className="font-medium">Restrictions</div>
                  <HtsgetRestriction
                    label="Congenital Heart Defect"
                    setFn={setCongenitalHeartDefect}
                    restriction="CongenitalHeartDefect"
                    checked={congenitalHeartDefect}
                  ></HtsgetRestriction>
                  <HtsgetRestriction
                    label="Autism"
                    setFn={setAutism}
                    restriction="Autism"
                    checked={autism}
                  ></HtsgetRestriction>
                  <HtsgetRestriction
                    label="Achromatopsia"
                    setFn={setAchromatopsia}
                    restriction="Achromatopsia"
                    checked={achromatopsia}
                  ></HtsgetRestriction>
                </div>
              </SharingConfigurationAccordion>
            )}

            {features.has(FEATURE_DATA_SHARING_AWS_ACCESS_POINT) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/awsAccessPointEnabled"
                label="AWS Access Point"
                current={awsAccessPointEnabled}
              >
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Account Id</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={
                      releaseData.dataSharingAwsAccessPoint?.accountId
                    }
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">VPC Id</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={releaseData.dataSharingAwsAccessPoint?.vpcId}
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Install Cloud Formation</span>
                  </label>
                  <button type="button" className="btn-normal" disabled={true}>
                    Install
                  </button>
                </div>
              </SharingConfigurationAccordion>
            )}

            {features.has(FEATURE_DATA_SHARING_GCP_IAM) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/gcpStorageIamEnabled"
                label="GCP Storage IAM"
                current={gcpStorageIamEnabled}
              >
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Users</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={releaseData.dataSharingGcpStorageIam?.users.join(
                      " "
                    )}
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Apply</span>
                    <span className="label-text-alt">
                      (running time can be minutes)
                    </span>
                  </label>
                  <button type="button" className="btn-normal" disabled={true}>
                    Apply
                  </button>
                </div>
              </SharingConfigurationAccordion>
            )}
          </RhChecks>
        </RightDiv>
      </RhSection>
    </Box>
  );
};
