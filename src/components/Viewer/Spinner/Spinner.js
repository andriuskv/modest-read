import React from "react";
import "./spinner.scss";
import spinner from "../../../assets/ring.svg";

export default function Spinner() {
  return (
    <div className="viewer-spinner-mask">
      <img src={spinner} alt=""/>
    </div>
  );
}
