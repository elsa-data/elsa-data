import React, { useState } from "react";
import { Alert, TriangleExclamationIcon } from "../components/alert";
import { createCtx } from "./create-ctx";

type ShowAlert = {
  show: (props: { description: string }) => void;
};
export const [useShowAlert, CtxProvider] = createCtx<ShowAlert>();

export default function ShowAlert(props: { children: React.ReactNode }) {
  const [isShowing, setIsShowing] = useState(false);

  const [alertProps, setAlertProps] = useState({
    description: "",
  });

  const handleIsShowing = ({ description }: { description: string }) => {
    setIsShowing(true);
    setAlertProps({ description });
  };

  return (
    <CtxProvider value={{ show: handleIsShowing }}>
      {isShowing && (
        <>
          <div
            className={`pointer-events-none absolute z-20 h-full w-full backdrop-blur	`}
          />
          <div className="absolute z-[21] flex w-full justify-center">
            <Alert
              icon={<TriangleExclamationIcon />}
              description={alertProps.description}
              additionalAlertClassName={`container alert mt-4 shadow-2xl`}
              closeCallback={() => setIsShowing(false)}
            />
          </div>
        </>
      )}
      {props.children}
    </CtxProvider>
  );
}
