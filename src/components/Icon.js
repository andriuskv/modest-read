export default function Icon({ name, title, size = "20px", className, style = {} }) {
  const icons = {
    grid: `M16,5V11H21V5M10,11H15V5H10M16,18H21V12H16M10,18H15V12H10M4,18H9V12H4M4,11H9V5H4V11Z`,
    list: `M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4V14Z`,
    trash: `M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z`,
    menu: `M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z`,
    close: `M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z`,
    "dots-vertical": `M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z`,
    upload: `M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z`,
    "circle-cross": `M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z`,
    "circle-check": `M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z`,
    bookshelf: `M9 3V18H12V3H9M12 5L16 18L19 17L15 4L12 5M5 5V18H8V5H5M3 19V21H21V19H3Z`,
    book: `M6.012,18H21V4c0-1.104-0.896-2-2-2H6C4.794,2,3,2.799,3,5v3v6v3v2c0,2.201,1.794,3,3,3h15v-2H6.012 C5.55,19.988,5,19.805,5,19S5.55,18.012,6.012,18z M8,6h9v2H8V6z`,
    "open-book": `M19 2L14 6.5V17.5L19 13V2M6.5 5C4.55 5 2.45 5.4 1 6.5V21.16C1 21.41 1.25 21.66 1.5 21.66C1.6 21.66 1.65 21.59 1.75 21.59C3.1 20.94 5.05 20.5 6.5 20.5C8.45 20.5 10.55 20.9 12 22C13.35 21.15 15.8 20.5 17.5 20.5C19.15 20.5 20.85 20.81 22.25 21.56C22.35 21.61 22.4 21.59 22.5 21.59C22.75 21.59 23 21.34 23 21.09V6.5C22.4 6.05 21.75 5.75 21 5.5V19C19.9 18.65 18.7 18.5 17.5 18.5C15.8 18.5 13.35 19.15 12 20V6.5C10.55 5.4 8.45 5 6.5 5Z`,
    "book-question-mark": `M19,2H6A2.91,2.91,0,0,0,3,5V19a2.91,2.91,0,0,0,3,3H21V20H6a1,1,0,1,1,0-2H21V4A2,2,0,0,0,19,2ZM13.09,16h-1.8V14.2h1.8Zm2.1-6.2c-.5.6-1.3,1-1.7,1.5a2.54,2.54,0,0,0-.4,1.7h-1.8a4.52,4.52,0,0,1,.4-2.45,7.22,7.22,0,0,1,1.7-1.35c1.45-1.34,1.09-3.24-.9-3.4a1.8,1.8,0,0,0-1.8,1.8H8.89A3.6,3.6,0,0,1,12.49,4,3.48,3.48,0,0,1,15.19,9.8Z`,
    "book-check-mark": `M19,2H6A2.91,2.91,0,0,0,3,5V19a2.91,2.91,0,0,0,3,3H21V20H6a1,1,0,1,1,0-2H21V4A2,2,0,0,0,19,2ZM9.61,15.75,5,11.15,7.1,9.06l2.51,2.51,7.31-7.32L19,6.34Z`,
    "menu-down": `M7,10L12,15L17,10H7Z`,
    "reset": `M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z`,
    plus: `M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z`,
    minus: `M19,13H5V11H19V13Z`,
    "arrow-up": `M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z`,
    "arrow-down": `M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z`,
    info: `M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z`,
    exit: `M19,3H5C3.89,3 3,3.89 3,5V9H5V5H19V19H5V15H3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M10.08,15.58L11.5,17L16.5,12L11.5,7L10.08,8.41L12.67,11H3V13H12.67L10.08,15.58Z`,
    sort: `M3 11H15V13H3M3 18V16H21V18M3 6H9V8H3Z`,
    search: `M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z`,
    "chevron-left": `M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z`,
    "chevron-right": `M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z`,
    page: `M17,22H7a2,2,0,0,1-2-2V4A2,2,0,0,1,7,2H17a2,2,0,0,1,2,2V20A2,2,0,0,1,17,22Z`,
    pages: `M16,4H8A2,2,0,0,1,6,2H18A2,2,0,0,1,16,4Zm2,12V8a2,2,0,0,0-2-2H8A2,2,0,0,0,6,8v8a2,2,0,0,0,2,2h8A2,2,0,0,0,18,16Zm0,6a2,2,0,0,0-2-2H8a2,2,0,0,0-2,2H18Z`,
    spread: `M9,19H4a2,2,0,0,1-2-2V7A2,2,0,0,1,4,5H9a2,2,0,0,1,2,2V17A2,2,0,0,1,9,19Zm13-2V7a2,2,0,0,0-2-2H15a2,2,0,0,0-2,2V17a2,2,0,0,0,2,2h5A2,2,0,0,0,22,17Z`,
    rotate: `M16.89,15.5L18.31,16.89C19.21,15.73 19.76,14.39 19.93,13H17.91C17.77,13.87 17.43,14.72 16.89,15.5M13,17.9V19.92C14.39,19.75 15.74,19.21 16.9,18.31L15.46,16.87C14.71,17.41 13.87,17.76 13,17.9M19.93,11C19.76,9.61 19.21,8.27 18.31,7.11L16.89,8.53C17.43,9.28 17.77,10.13 17.91,11M15.55,5.55L11,1V4.07C7.06,4.56 4,7.92 4,12C4,16.08 7.05,19.44 11,19.93V17.91C8.16,17.43 6,14.97 6,12C6,9.03 8.16,6.57 11,6.09V10L15.55,5.55Z`,
    outline: `M6 4.5A1.5 1.5 0 114.5 3 1.5 1.5 0 016 4.5zM4.5 18A1.5 1.5 0 106 19.5 1.5 1.5 0 004.5 18zm0-5A1.5 1.5 0 106 14.5 1.5 1.5 0 004.5 13zm0-5A1.5 1.5 0 106 9.5 1.5 1.5 0 004.5 8zM19 4.5A1.5 1.5 0 0017.5 3h-8A1.5 1.5 0 008 4.5 1.5 1.5 0 009.5 6h8A1.5 1.5 0 0019 4.5zm-2 5A1.5 1.5 0 0015.5 8h-6A1.5 1.5 0 008 9.5 1.5 1.5 0 009.5 11h6A1.5 1.5 0 0017 9.5zm4 5a1.5 1.5 0 00-1.5-1.5h-10A1.5 1.5 0 008 14.5 1.5 1.5 0 009.5 16h10a1.5 1.5 0 001.5-1.5zm-1 5a1.5 1.5 0 00-1.5-1.5h-9A1.5 1.5 0 008 19.5 1.5 1.5 0 009.5 21h9a1.5 1.5 0 001.5-1.5z`,
    home: `M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z`,
    stats: `M18,21H16V3h2ZM8,7H6V21H8Zm5,4H11V21h2Z`,
    zoom: `M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z`,
    user: `M12,19.2C9.5,19.2 7.29,17.92 6,16C6.03,14 10,12.9 12,12.9C14,12.9 17.97,14 18,16C16.71,17.92 14.5,19.2 12,19.2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z`,
    cloud: `M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z`,
    margin: `M18 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V4C20 2.9 19.11 2 18 2M18 20H6V16H18V20M18 8H6V4H18V8Z`
  };
  style = { ...style, width: size, height: size };

  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      {title && <title>{title}</title>}
      <path d={icons[name]} />
    </svg>
  );
}
