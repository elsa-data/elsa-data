// SOURCED FROM https://tablericons.com/

/**
 * Given a set of URIs (for datasets) - we return a map that consistently gives them
 * a custom mini icon using numbers and colours.
 *
 * @param uris an array of datasets Uris
 */
export function createDatasetMap(uris: string[]) {
  return new Map(
    uris.sort().map((duri, index) => [duri, createSquareIcon(index)]),
  );
}

const colourPalette = [
  "#ff2825",
  "#a905b6",
  "#6f32be",
  "#00bfd8",
  "#00b341",
  "#7bc62d",
  "#ffec00",
  "#ffbf00",
  "#ff9300",
  "#ff4500",
  "#7f5345",
  "#597e8d",
  "#009988",
  "#c9de00",
  "#00abfb",
  "#fd0061",
];

function createSquareIcon(num: number) {
  const fillColour = "none";
  const strokeColour =
    num < colourPalette.length ? colourPalette[num] : "#000000";
  const strokeWidth = 1.5;

  switch (num) {
    case 0:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-0"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 8a2 2 0 0 1 2 2v4a2 2 0 1 1 -4 0v-4a2 2 0 0 1 2 -2z" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 1:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-1"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 16v-8l-2 2" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );

    case 2:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-2"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 10a2 2 0 1 1 4 0c0 .591 -.417 1.318 -.816 1.858l-3.184 4.143l4 0" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 3:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-3"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12a2 2 0 1 0 -2 -2" />
          <path d="M10 14a2 2 0 1 0 2 -2" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 4:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-4"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M13 16v-8l-4 6h5" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 5:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-5"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 16h2a2 2 0 1 0 0 -4h-2v-4h4" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 6:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-6"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <circle transform="rotate(180 12 14)" cx="12" cy="14" r="2" />
          <path d="M14 10a2 2 0 1 0 -4 0v4" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 7:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-7"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 8h4l-2 8" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 8:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-8"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <circle cx="12" cy="10" r="2" />
          <circle cx="12" cy="14" r="2" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 9:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-9"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <circle cx="12" cy="10" r="2" />
          <path d="M10 14a2 2 0 1 0 4 0v-4" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-dot"
          viewBox="0 0 24 24"
          strokeWidth={strokeWidth}
          stroke={strokeColour}
          fill={fillColour}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
  }
}

/*function createCircleIcon(num: number) {
  const WIDTH = 22;
  const HEIGHT = 22;
  switch (num % 2) {
    case 0:

    case 1:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-circle-1"
          width={WIDTH}
          height={HEIGHT}
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#ff9300"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 16v-8l-2 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );

    case 2:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-circle-2"
          width="44"
          height="44"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#00b341"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 10a2 2 0 1 1 4 0c0 .591 -.417 1.318 -.816 1.858l-3.184 4.143l4 0" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
} */
