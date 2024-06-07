import spinner from "assets/ring.svg";
import "./spinner.css";

export default function Spinner({ className, noMask }) {
  if (noMask) {
    return <img src={spinner} className={`viewer-spinner${className ? ` ${className}` : ""}`} alt=""/>;
  }
  return (
    <div className="viewer-spinner-mask">
      <img src={spinner} alt=""/>
    </div>
  );
}
