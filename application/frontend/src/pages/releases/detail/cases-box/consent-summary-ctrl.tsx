import type { ConsentStatementDynamicDuoType } from "../../../../../../backend/src/shared/schemas-releases";

type Props = {
  statement: ConsentStatementDynamicDuoType;
};

function ConsentSummaryCtrl({ statement }: Props) {
  return (
    <div className="space-y-4 prose">
      <p>
        Dynamic consent with identifier{" "}
        <code>{statement.consentSystemIdentifier}</code>
      </p>
    </div>
  );
}

export default ConsentSummaryCtrl;
