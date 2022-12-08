import React, { useState } from "react";
import { useCombobox } from "downshift";
import axios from "axios";
import classNames from "classnames";
import _ from "lodash";
import { CodingType } from "@umccr/elsa-types";
import { doLookup } from "../../helpers/ontology-helper";
import { useEnvRelay } from "../../providers/env-relay-provider";

const Chip: React.FC<{
  c: CodingType;
  removeFromSelected: (c: CodingType) => void;
}> = ({ c, removeFromSelected }) => {
  const [display, setDisplay] = useState<string | undefined>(undefined);

  const envRelay = useEnvRelay();
  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  React.useEffect(() => {
    const fetchData = async () => {
      const display = (await doLookup(terminologyFhirUrl, c))?.display;
      setDisplay(display);
    };
    fetchData().catch();
  });

  return (
    <li className="px-4 py-2 rounded-full text-gray-500 bg-gray-200 text-sm flex-none flex align-center w-max cursor-pointer active:bg-gray-300 transition duration-300 ease">
      {display ?? c.code}
      <button
        className="bg-transparent hover focus:outline-none"
        onClick={() => removeFromSelected(c)}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="times"
          className="w-3 ml-3"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 352 512"
        >
          <path
            fill="currentColor"
            d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
          ></path>
        </svg>
      </button>
    </li>
  );
};

type Props = {
  className: string;

  systemUri: string; // "http://purl.obolibrary.org/obo/hp.owl"
  systemVersion?: string; // "20191108"

  rootConceptId: string; // "HP:0000118"

  disabled: boolean;

  label: string;
  codePrefix: string;
  placeholder: string;

  // the list of currently visible concepts
  selected: CodingType[];

  // the actions to change the list of selected concepts
  addToSelected(coding: CodingType): void;
  removeFromSelected(coding: CodingType): void;
};

/**
 * A dropdown box (with persistent list of 'selected' items) - that browses a FHIR based
 * ontology server for concepts.
 *
 * @param props
 * @constructor
 */
export const ConceptChooser: React.FC<Props> = (props: Props) => {
  const envRelay = useEnvRelay();
  const terminologyFhirUrl = envRelay.terminologyFhirUrl;

  // a code array that is set on mount to the same as props.selected - and which then
  // is background filled with 'display' terms

  // TODO: THIS IS WRONG.. NEEDS FIXING..

  const listItemBadge = (cn: string) => {};

  // given the number of display terms is likely to be small, and is very stable - we aggressively
  // cache them locally and use those values rather than go to the network
  /*const [codesWithDisplay, setCodesWithDisplay] = useState(
    props.selected.map((c) => {
      const newC: CodingType = { system: c.system, code: c.code };
      if (makeCacheEntry(c.system, c.code) in ontologyLookupCache) {
        newC.display = ontologyLookupCache[makeCacheEntry(c.system, c.code)];
      }
      return newC;
    })
  ); */

  // state for the list of concepts that appear as we are doing searchers
  const [searchHits, setSearchHits] = useState([] as CodingType[]);

  /*React.useEffect(() => {
    const fetchData = async () => {
      const newCodes = await doBatchLookup(
        "https://onto.prod.umccr.org/fhir",
        codesWithDisplay
      );
      console.log(JSON.stringify(newCodes));
      setCodesWithDisplay([...newCodes]);
    };
    fetchData().catch();
  }, [props.selected]); */

  const stateReducer = (state: any, actionAndChanges: any) => {
    const { type, changes } = actionAndChanges;
    switch (type) {
      case useCombobox.stateChangeTypes.ItemClick:
      case useCombobox.stateChangeTypes.InputKeyDownEnter:
        return {
          // blank out the input after selection
          ...changes,
          inputValue: "",
        };
      case useCombobox.stateChangeTypes.InputChange:
      case useCombobox.stateChangeTypes.InputBlur:
      default:
        // otherwise business as usual
        return changes;
    }
  };

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: searchHits,
    stateReducer,
    itemToString: (item) => item?.display || "",
    onInputValueChange: ({ inputValue }) => {
      if (inputValue) fetchConceptSearch(inputValue);
    },
    onSelectedItemChange: (item) => {
      if (item.selectedItem) {
        props.addToSelected(item.selectedItem);
      }
    },
  });

  /**
   * Search the ontology server for given query text.
   *
   * @param query
   */
  const fetchConceptSearch = (query: string) => {
    if (!query || query.length < 3) {
      setSearchHits([]);
      return;
    }

    axios
      .get(`${terminologyFhirUrl}/ValueSet/$expand`, {
        params: {
          _format: "json",
          filter: query,
          url: props.systemUri,
          "system-version": props.systemVersion
            ? props.systemVersion
            : undefined,
          includeDesignations: true,
          count: 100,
          elements:
            "expansion.contains.code,expansion.contains.display,expansion.contains.fullySpecifiedName,expansion.contains.active",
        },
        headers: {
          "Content-Type": "application/fhir+json",
        },
      })
      .then((response) => {
        if (_.isArray(response.data.expansion.contains))
          setSearchHits(
            response.data.expansion.contains.map((ontoResult: any) => {
              return {
                system: ontoResult.system,
                code: ontoResult.code,
                display: ontoResult.display,
              };
            })
          );
      });
  };

  return (
    <div className={props.className}>
      <label
        {...getLabelProps()}
        className="block text-sm font-medium text-gray-700"
      >
        {props.label}
      </label>

      <div className="mt-1 p-2 rounded-md w-full border border-gray-300">
        <ul className="flex flex-row flex-wrap gap-2">
          {!_.isEmpty(props.selected) && (
            <>
              {Object.values(props.selected).map((c, index) => (
                <Chip c={c} removeFromSelected={props.removeFromSelected} />
              ))}
            </>
          )}
          <input
            type="text"
            {...getInputProps({
              placeholder: props.placeholder,
              disabled: props.disabled,
            })}
            className="min-w-[15em] flex-grow border-none border-white focus:border-none p-0"
          />
        </ul>
      </div>
      {/* if the input element is open, render the div else render nothing*/}
      {isOpen && searchHits && searchHits.length > 0 && (
        <div
          className="origin-top-left overflow-auto absolute z-10 mt-1 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
          {...getMenuProps()}
        >
          <div className="py-1" role="none">
            {searchHits.slice(0, 10).map((item: any, index: number) => {
              const itemProps = getItemProps({
                key: index,
                index,
                item,
              });

              const classn = classNames(
                {
                  "bg-gray-100": highlightedIndex === index,
                  "text-gray-900": highlightedIndex === index,
                  "text-gray-700": highlightedIndex !== index,
                },
                "block",
                "px-4",
                "py-2",
                "text-sm"
              );

              return (
                <div
                  className={classn}
                  role="menuitem"
                  tabIndex={-1}
                  key={itemProps.key}
                  {...itemProps}
                >
                  <span className="mr-6" />
                  {item.display}
                </div>
              );
            })}
            {searchHits.length > 10 && (
              <div
                className="block px-4 py-2 text-sm"
                role="menuitem"
                tabIndex={-1}
              >
                ...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
