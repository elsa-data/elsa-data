import React, {
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Transition } from "@headlessui/react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

export type AlertProps = {
  description: ReactNode;
};

/**
 * Check if the referenced element is in view.
 * @param ref
 */
export const useIsInView = (ref: RefObject<HTMLElement>): boolean => {
  const [isInView, setIsInView] = useState(false);

  const onScroll = () => {
    if (!ref.current) {
      setIsInView(false);
      return;
    }
    const top = ref.current.getBoundingClientRect().top;

    // Set only once
    if (!isInView) {
      setIsInView(top + 100 >= 0 && top - 100 <= window.innerHeight);
    }
  };

  // Call once at the start
  useEffect(onScroll, []);

  useEffect(() => {
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  return isInView;
};

/**
 * An alert element.
 */
export const Alert = ({ description }: AlertProps): JSX.Element => {
  const alertRef = useRef<HTMLDivElement>(null);
  const isInView = useIsInView(alertRef);

  useEffect(() => {
    alertRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [alertRef]);

  const [dismissed, setDismissed] = useState(false);

  return (
    <Transition
      className={classNames("alert alert-warning shadow-lg", {
        "animate-pop": isInView,
      })}
      show={!dismissed}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      ref={alertRef}
    >
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 flex-shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{description}</span>
      </div>
      <button
        className="btn-ghost btn-sm btn"
        onClick={() => {
          setDismissed(true);
        }}
      >
        <FontAwesomeIcon icon={faX} />
      </button>
    </Transition>
  );
};
