import React, { useState } from "react";
import { useCombobox } from "downshift";
import axios from "axios";
import classNames from "classnames";
import _ from "lodash";
import type { CodingType } from "./concept-chooser-types";
import { useEnvRelay } from "../../providers/env-relay-provider";
import { Chip } from "./concept-chooser-chip.tsx";

type Props = {
  className?: string;

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

  // const listItemBadge = (cn: string) => {};

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
      setCodesWithDisplay([...newCodes]);
    };
    fetchData().catch();
  }, [props.selected]); */

  const stateReducer = (_state: any, actionAndChanges: any) => {
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
            }),
          );
      });
  };

  return (
    <div
      className={classNames(props.className, { "opacity-50": props.disabled })}
    >
      <label
        {...getLabelProps()}
        className="block text-sm font-medium text-gray-700"
      >
        {props.label}
      </label>

      <div className="mt-1 w-full rounded-md border border-gray-300 p-2">
        <ul className="flex flex-row flex-wrap gap-2">
          {!_.isEmpty(props.selected) && (
            <>
              {Object.values(props.selected).map((c, index) => (
                <Chip
                  key={index}
                  c={c}
                  removeFromSelected={props.removeFromSelected}
                />
              ))}
            </>
          )}
          <input
            type="text"
            {...getInputProps({
              placeholder: props.placeholder,
              disabled: props.disabled,
            })}
            className="min-w-[15em] flex-grow border-none border-white p-0 focus:border-none"
          />
        </ul>
      </div>
      {/* if the input element is open, render the div else render nothing*/}
      {isOpen && searchHits && searchHits.length > 0 && (
        <div
          className="absolute z-10 mt-1 w-96 origin-top-left overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
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
                "text-sm",
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
