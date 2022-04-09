export default function Icon({ id, title, size = "20px", className, style = {} }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ ...style, width: size, height: size }}>
      {title && <title>{title}</title>}
      <use href={`#${id}`}></use>
    </svg>
  );
}
