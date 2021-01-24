import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./reading-stats.scss";
import { setDocumentTitle } from "../../utils";
import Header from "../Header";
import Icon from "../Icon";
import { getReadingTime } from "../../services/readingTimeService";

export default function ReadingStats() {
  const readingTime = parseReadingTime(getReadingTime());

  useEffect(() => {
    setDocumentTitle("Reading Statistics");
  }, []);

  function parseReadingTime(readingTime) {
    const years = [];

    for (const key of Object.keys(readingTime)) {
      const year = {
        name: key,
        months: []
      };
      let maxDuration = 0;

      for (const [index, days] of Object.entries(readingTime[key])) {
        const duration = days.reduce((duration, day) => duration + day, 0);

        if (duration > maxDuration) {
          maxDuration = duration;
        }
        year.months.push({
          durationInSeconds: duration,
          duration: parseDuration(duration),
          name: getMonthName(index, true)
        });
      }

      for (const month of year.months) {
        month.barHeight = getBarHeight(month.durationInSeconds, maxDuration);
      }
      years.push(year);
    }
    return years;
  }

  function getMonthName(month, useShortName = false) {
    const months = {
      0: "January",
      1: "February",
      2: "March",
      3: "April",
      4: "May",
      5: "June",
      6: "July",
      7: "August",
      8: "September",
      9: "October",
      10: "November",
      11: "December"
    };

    return useShortName ? months[month].slice(0, 3) : months[month];
  }

  function parseDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.ceil(duration % 3600 / 60);
    let str = "";

    if (hours) {
      str += `${hours} hr `;
    }
    str += `${minutes} min`;
    return str;
  }

  function getBarHeight(duration, maxDuration) {
    if (duration) {
      return (duration / (maxDuration + maxDuration * 0.33)) * 100;
    }
    return 0;
  }

  return (
    <div className="container">
      <Header/>
      {readingTime.length ? (
        <>
          <h2 className="stats-title">Reading Statistics</h2>
          {readingTime.map((year, i) => (
            <div className="stats-graph-container" key={i}>
              <h3 className="stats-graph-title">{year.name}</h3>
              <div className="stats-graph">
                {year.months.map((month, i) => (
                  <div className="stats-graph-item" key={i}>
                    <div className="stats-graph-item-bar-container">
                      <div className="stats-graph-item-duration"
                        style={{ bottom: `${month.barHeight}%`}}>{month.duration}</div>
                      <div className="stats-graph-item-bar" style={{ height: `${month.barHeight}%` }}></div>
                    </div>
                    <div className="stats-graph-item-label">{month.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="stats-no-data">
          <p className="stats-no-data-message">No statistics to display.</p>
          <Link to="/" className="btn icon-text-btn primary-btn">
            <Icon name="home" size="24px"/>
            <span>Home</span>
          </Link>
        </div>
      )}
    </div>
  );
}
