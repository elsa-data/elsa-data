import classNames from "classnames";
import React from "react";
import { isString } from "lodash";
import { Pagination } from "react-headless-pagination";
import ReactPaginate from "react-paginate";

type Props = {
  // the maximum number of rows to display on one page (i.e. page limit)
  itemsPerPage: number;

  // the word that describes each row (i.e. "cases", "patients", "datasets")
  rowWord: string;

  // the total number of rows that we will be scrolling/paging through
  rowCount: number;

  // the state variable holding the current page
  currentPage: number;

  // these props are from the header paginator component - created in the parent box
  setPage: (newPage: number) => void;

  isLoading?: boolean;
};

/**
 * A paginator component styled to live in the footer of our paged tables.
 *
 * @param props
 * @constructor
 */
export const TableFooterPaginator: React.FC<Props> = (props) => {
  // for our pagination buttons and text we need to do some page calculations
  const maxPage = Math.ceil(props.rowCount / props.itemsPerPage);
  console.log(`Max page = ${maxPage}`);
  /*const from = Math.min(
    (props.currentPage - 1) * props.rowsPerPage + 1,
    props.rowCount
  );
  const to = Math.min(
    (props.currentPage - 1) * props.rowsPerPage + props.rowsPerPage,
    props.rowCount
  ); */

  const handlePageChange = (event: any) => {
    console.log(event.selected);
    props.setPage(event.selected);
  };

  return (
    <tr>
      {/* a colspan larger than all columns is truncated back to the actual number of columns meaning this
          is full width in all tables */}
      <td colSpan={99}>
        <>
          {/* prev/next buttons only on small devices */}
          <div className="flex flex-1 justify-between sm:hidden">
            <a
              onClick={() => props.setPage(props.currentPage - 1)}
              className="btn-sm btn"
            >
              Previous
            </a>
            <a
              onClick={() => props.setPage(props.currentPage + 1)}
              className="btn-sm btn"
            >
              Next
            </a>
          </div>
          {/* a full pagination UI if space */}
          <div className="hidden items-center justify-between sm:flex">
            <span>Some text</span>
            <ReactPaginate
              breakLabel="…"
              nextLabel=">"
              containerClassName="btn-group"
              activeClassName="btn-active"
              nextClassName="btn btn-sm"
              pageClassName="btn btn-sm"
              breakClassName="btn btn-sm"
              onPageChange={handlePageChange}
              pageCount={maxPage}
              previousLabel="<"
              previousClassName="btn btn-sm"
              disabledClassName="btn-disabled"
            />
          </div>
        </>
      </td>
    </tr>
  );
};
