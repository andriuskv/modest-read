import { useState, useEffect, useMemo } from "react";
import { setDocumentTitle, getMonthName, getWeekdayName, getDaysInMonth, getCurrentDate, getFirstDayIndex } from "../../utils";
import Header from "../Header";
import Icon from "../Icon";
import { getReadingTime, getCalendarYear } from "../../services/readingTimeService";
import "./reading-stats.scss";

export default function ReadingStats() {
  const currentDate = useMemo(() => getCurrentDate(), []);
  const [activeYear, setActiveYear] = useState(currentDate.year);
  const [activeWeek, setActiveWeek] = useState(currentDate.week);
  const [activeView, setActiveView] = useState("week");
  const [durationCalendar, setDurationCalendar] = useState(() => {
    const { year } = currentDate;

    return {
      [year]: {
        name: year,
        months: getDurationMonths(year),
        weeks: getDurationWeeks(year)
      }
    };
  });

  useEffect(() => {
    setDocumentTitle("Reading Statistics");
  }, []);

  function getDurationMonths(year) {
    const calendar = getReadingTime();
    const calendarYear = calendar[year] || getCalendarYear(year);
    const months = [];
    let maxDuration = 0;

    for (const [index, days] of Object.entries(calendarYear)) {
      const duration = days.reduce((duration, day) => duration + day, 0);

      if (duration > maxDuration) {
        maxDuration = duration;
      }
      months.push({
        durationInSeconds: duration,
        duration: parseDuration(duration),
        name: getMonthName(index, true)
      });
    }

    for (const month of months) {
      month.barHeight = getBarHeight(month.durationInSeconds, maxDuration);
    }
    return months;
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

  function getDurationWeeks(year) {
    const calendar = getReadingTime();
    const calendarYear = calendar[year] || getCalendarYear(year);
    const firstDayIndex = getFirstDayIndex(year, 0);
    const shouldGetFullYear = year !== currentDate.year;
    const weeks = [];
    let week = [];
    let maxDuration = 0;
    let weeksToGet = shouldGetFullYear ? 52 : currentDate.week;

    for (let i = firstDayIndex; i > 0; i -= 1) {
      const previousYear = calendar[year - 1];
      let duration = 0;

      if (previousYear) {
        const lastMonth = previousYear[previousYear.length - 1];
        const day = lastMonth[lastMonth.length - i - 1];
        duration = day;
      }
      week.push({
        durationInSeconds: duration,
        duration: parseDuration(duration),
        name: getWeekdayName(week.length, true)
      });
    }

    for (const month of calendarYear) {
      for (const duration of month) {
        if (duration > maxDuration) {
          maxDuration = duration;
        }
        week.push({
          durationInSeconds: duration,
          duration: parseDuration(duration),
          name: getWeekdayName(week.length, true)
        });

        if (week.length === 7) {
          for (const day of week) {
            day.barHeight = getBarHeight(day.durationInSeconds, maxDuration);
          }
          weeks.push(week);
          week = [];
          maxDuration = 0;

          if (weeksToGet === 0 && !shouldGetFullYear) {
            return weeks;
          }
          weeksToGet -= 1;
        }
      }
    }
    return weeks;
  }

  function selectView(view) {
    setActiveView(view);
    setActiveYear(currentDate.year);

    if (view === "week") {
      setActiveWeek(currentDate.week);
    }
  }

  function nextYear() {
    if (activeYear === currentDate.year) {
      return;
    }
    setActiveYear(activeYear + 1);
  }

  function previousYear() {
    const previousYear = activeYear - 1;
    const previousDurationYear = durationCalendar[previousYear];

    if (!previousDurationYear?.months) {
      const year = previousDurationYear || { name: previousYear };
      year.months = getDurationMonths(previousYear);
      setDurationCalendar({ ...durationCalendar, [previousYear]: year });
    }
    setActiveYear(previousYear);
  }

  function nextWeek() {
    if (activeWeek === currentDate.week && activeYear === currentDate.year) {
      return;
    }
    let nextWeek = activeWeek + 1;

    if (nextWeek === 52) {
      nextWeek = 0;
      setActiveYear(activeYear + 1);
    }
    setActiveWeek(nextWeek);
  }

  function previousWeek() {
    const previousYear = activeYear - 1;
    const previousDurationYear = durationCalendar[previousYear];
    let previousWeek = activeWeek - 1;

    if (previousWeek === 0 && !previousDurationYear?.weeks) {
      const year = previousDurationYear || { name: previousYear };
      year.weeks = getDurationWeeks(previousYear);
      setDurationCalendar({ ...durationCalendar, [previousYear]: year });
    }
    else if (previousWeek === -1) {
      previousWeek = 51;
      setActiveYear(activeYear - 1);
    }
    setActiveWeek(previousWeek);
  }

  function getWeekRangeString() {
    const firstDayIndex = getFirstDayIndex(activeYear, 0);

    if (activeWeek === 0) {
      const daysInMonth = getDaysInMonth(activeYear, 11);
      const weekStartDay = daysInMonth - (firstDayIndex - 1);

      return `${getMonthName(11)} ${weekStartDay}, ${activeYear - 1} - ${getMonthName(0)} ${7 - firstDayIndex}, ${activeYear}`;
    }
    let weekStartDay = (activeWeek + 1) * 7 - 7 - firstDayIndex;
    let month = 0;
    let daysInMonth = getDaysInMonth(activeYear, month);

    while (weekStartDay >= daysInMonth) {
      weekStartDay -= daysInMonth;
      month += 1;
      daysInMonth = getDaysInMonth(activeYear, month);
    }

    if (weekStartDay + 7 > daysInMonth) {
      return `${getMonthName(month)} ${weekStartDay + 1} - ${getMonthName(month + 1)} ${weekStartDay + 7 - daysInMonth}, ${activeYear}`;
    }
    return `${getMonthName(month)} ${weekStartDay + 1} - ${weekStartDay + 7}, ${activeYear}`;
  }

  function getRangeDurationString() {
    let items = [];

    if (activeView === "week") {
      items = durationCalendar[activeYear].weeks[activeWeek];
    }
    else if (activeView === "year") {
      items = durationCalendar[activeYear].months;
    }
    const duration = items.reduce((duration, month) => duration + month.durationInSeconds, 0);
    return parseDuration(duration);
  }

  function renderWeekGraph() {
    return (
      <div className="stats-graph-container">
        <div className="stats-graph-top">
          <button className="btn icon-btn" onClick={previousWeek}>
            <Icon name="chevron-left" size="24px"/>
          </button>
          <div className="stats-graph-info">
            <h3 className="stats-graph-title">{getWeekRangeString()}</h3>
            <div className="stats-graph-duration">{getRangeDurationString()}</div>
          </div>
          {activeWeek === currentDate.week && activeYear === currentDate.year ? null : (
            <button className="btn icon-btn" onClick={nextWeek}>
              <Icon name="chevron-right" size="24px"/>
            </button>
          )}
        </div>
        <div className="stats-graph">
          {durationCalendar[activeYear].weeks[activeWeek].map((day, i) => (
            <div className="stats-graph-item" key={i}>
              <div className="stats-graph-item-bar-container">
                <div className="stats-graph-item-duration"
                  style={{ bottom: `${day.barHeight}%`}}>{day.duration}</div>
                <div className="stats-graph-item-bar" style={{ height: `${day.barHeight}%` }}></div>
              </div>
              <div className={`stats-graph-item-label${activeWeek === currentDate.week && activeYear === currentDate.year && i === currentDate.weekday ? " active" : ""}`}>{day.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderYearGraph() {
    return (
      <div className="stats-graph-container">
        <div className="stats-graph-top">
          <button className="btn icon-btn" onClick={previousYear}>
            <Icon name="chevron-left" size="24px"/>
          </button>
          <div className="stats-graph-info">
            <h3 className="stats-graph-title">{durationCalendar[activeYear].name}</h3>
            <div className="stats-graph-duration">{getRangeDurationString()}</div>
          </div>
          {activeYear !== currentDate.year && (
            <button className="btn icon-btn" onClick={nextYear}>
              <Icon name="chevron-right" size="24px"/>
            </button>
          )}
        </div>
        <div className="stats-graph">
          {durationCalendar[activeYear].months.map((month, i) => (
            <div className="stats-graph-item" key={i}>
              <div className="stats-graph-item-bar-container">
                <div className="stats-graph-item-duration"
                  style={{ bottom: `${month.barHeight}%`}}>{month.duration}</div>
                <div className="stats-graph-item-bar" style={{ height: `${month.barHeight}%` }}></div>
              </div>
              <div className={`stats-graph-item-label${activeYear === currentDate.year && i === currentDate.month ? " active" : ""}`}>{month.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderGraph() {
    if (activeView === "week") {
      return renderWeekGraph();
    }
    else if (activeView === "year") {
      return renderYearGraph();
    }
    return null;
  }

  return (
    <div className="container">
      <Header className="stats-header"/>
      <div className="stats-view-selection">
        <button className={`btn stats-view-selection-btn${activeView === "week" ? " active" : ""}`}
          onClick={() => selectView("week")}>Week</button>
        <button className={`btn stats-view-selection-btn${activeView === "year" ? " active" : ""}`}
          onClick={() => selectView("year")}>Year</button>
      </div>
      {renderGraph()}
    </div>
  );
}
