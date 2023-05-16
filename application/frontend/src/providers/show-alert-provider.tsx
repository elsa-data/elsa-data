import React, { useState } from "react";
import { createCtx } from "./create-ctx";

type ShowAlert = {
  show: (props: { title: string; description: string }) => void;
};
export const [useShowAlert, CtxProvider] = createCtx<ShowAlert>();

export default function ShowAlert(props: { children: React.ReactNode }) {
  const [isShowing, setIsShowing] = useState(false);

  const [alertProps, setAlertProps] = useState({
    title: "",
    description: "",
  });

  const handleIsShowing = ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => {
    setIsShowing(true);
    setAlertProps({ title, description });
  };

  return (
    <CtxProvider value={{ show: handleIsShowing }}>
      {isShowing && (
        <>
          <div
            className={`pointer-events-none absolute z-20 h-full w-full backdrop-blur	`}
          />
          <div className="absolute z-[21] flex w-full justify-center">
            <div className="container alert mt-4 shadow-2xl">
              <div>
                <div>
                  <h3 className="font-bold">{alertProps.title}</h3>
                  <div className="text-xs">{alertProps.description}</div>
                </div>
              </div>
              <div className="flex-none">
                <button
                  onClick={() => setIsShowing(false)}
                  className="btn-sm btn"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {props.children}
    </CtxProvider>
  );
}
