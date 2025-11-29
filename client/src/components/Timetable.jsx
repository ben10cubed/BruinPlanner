import React, { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Timetable({ sections }) {
  const [hasWeekend, setHasWeekend] = useState(false);

  function convertDay(d) {
    const map = {
      Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5",
      Sat: "6", Sun: "0"
    };
    const ret = map[d];
    if (ret === "6" || ret === "0") setHasWeekend(true);
    return ret;
  }

  const events = useMemo(
    () =>
      sections.flatMap((sec) =>
        sec.days.map((day) => ({
          id: sec.id + "-" + day,
          title: `${sec.courseId} ${sec.label}`,
          startTime: sec.start,
          endTime: sec.end,
          daysOfWeek: [convertDay(day)],
          extendedProps: { location: sec.location }
        }))
      ),
    [sections]
  );

  function getLatestEndTime(sections) {
    let maxMinutes = 18 * 60;

    for (const sec of sections) {
      if (!sec.end) continue;
      const [h, m] = sec.end.split(":").map(Number);
      const minutes = h * 60 + m;
      maxMinutes = Math.max(maxMinutes, minutes);
    }

    return `${String(Math.ceil(maxMinutes / 60)).padStart(2, "0")}:00:00`;
  }

  const dynamicSlotMax = getLatestEndTime(sections);

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        navLinks={false}
        editable={false}
        selectable={false}
        height="800px"
        dayHeaderFormat={{ weekday: "short" }}
        firstDay={1}
        slotDuration="01:00:00"
        slotMinTime="08:00:00"
        slotMaxTime={dynamicSlotMax}
        weekends={hasWeekend}

        eventOverlap={false}
        slotEventOverlap={false}
        allDaySlot={false}


        events={events}
        eventContent={(info) => {
          const title = info.event.title;
          const location = info.event.extendedProps.location;

          return {
            html: `
            <div style="padding: 2px 4px; font-size: 11px; overflow:hidden;">
              <div style="font-weight: 600; font-size: 12px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
                ${title}
              </div>
              <div style="opacity: 0.8; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
                ${location || ""}
              </div>
            </div>`
          };
        }}
      />
    </div>
  );
}
