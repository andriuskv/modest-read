import bgImg from "./background-image.png";
import icon from "./icon.svg";
import "./landing-page.css";

export default function LandingPage({ hide }) {
  return (
    <div className="landing-container">
      <div className="landing">
        <div className="landing-background"></div>
        <div className="landing-background-image-container">
          <img src={bgImg} className="landing-background-image" alt=""/>
        </div>
        <div className="landing-main">
          <img src={icon} alt="" className="landing-icon"/>
          <h1 className="landing-title">ModestRead</h1>
          <p className="landing-subtitle">A simple way to enjoy reading.</p>
          <button className="btn primary-btn landing-btn" onClick={hide}>Get Started</button>
        </div>
      </div>
    </div>
  );
}
