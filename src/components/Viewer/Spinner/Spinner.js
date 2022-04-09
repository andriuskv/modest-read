import spinner from "assets/ring.svg";
import "./spinner.scss";

export default function Spinner() {
  return (
    <div className="viewer-spinner-mask">
      <img src={spinner} alt=""/>
    </div>
  );
}
