import spinner from "assets/ring.svg";
import "./spinner.css";

export default function Spinner() {
  return (
    <div className="viewer-spinner-mask">
      <img src={spinner} alt=""/>
    </div>
  );
}
