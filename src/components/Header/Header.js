import "./header.scss";

export default function Header({ className }) {
  return (
    <div className={`header-title-container${className ? ` ${className}` : ""}`}>
      <h1 className="header-title">ModestRead</h1>
    </div>
  );
}
