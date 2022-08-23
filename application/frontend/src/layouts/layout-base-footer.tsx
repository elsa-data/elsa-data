import React from "react";

export const LayoutBaseFooter: React.FC = () => {
  return (
    <>
      <footer className="bg-white border-t border-gray-400 shadow">
        <div className="container max-w-md mx-auto flex py-2">
          <div className="w-full mx-auto flex flex-wrap">
            <div className="flex w-full md:w-1/2 ">
              <div className="px-8">
                <h3 className="font-bold font-bold text-gray-900">About</h3>
                {/*<p className="py-4 text-gray-600 text-sm">
                  A data release coordinator
                </p> */}
              </div>
            </div>

            <div className="flex w-full md:w-1/2">
              <div className="px-8">
                <h3 className="font-bold font-bold text-gray-900">Social</h3>
                {/*<ul className="list-reset items-center text-sm pt-3">
                  <li>
                    <a
                      className="inline-block text-gray-600 no-underline hover:text-gray-900 hover:underline py-1"
                      href="https://www.ga4gh.org"
                    >
                      GA4GH
                    </a>
                  </li>
                </ul> */}
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* FOOTER END */}
    </>
  );
};
