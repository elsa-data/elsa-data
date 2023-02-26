import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";

export const LayoutBaseFooter: React.FC = () => {
  const envRelay = useEnvRelay();

  return (
    <>
      <div className="container mx-auto w-full">
        <footer className="p-4 dark:bg-gray-800 md:flex md:items-center md:justify-between md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-center">
            Elsa Data
            <span
              className="mr-1 ml-3 text-gray-300"
              title={envRelay.built + " " + envRelay.revision}
            >
              v
            </span>
            {envRelay.version}
          </span>
          <ul className="mt-3 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
            <li>
              <a
                href="https://github.com/umccr/elsa-data"
                className="hover:underline"
              >
                Github
              </a>
            </li>
          </ul>
        </footer>
      </div>

      {/* FOOTER END */}
    </>
  );
};
