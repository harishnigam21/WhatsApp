import { useState } from "react";
import { media } from "../../../assets/data/media";
import DayMessage from "./DayMessage";

export default function YearMessage({ year, dates, selectedUser }) {
  const [show, setShow] = useState(true);
  const sortableDate = (dateStr) => dateStr.split("/").reverse().join("");
  return (
    <article className="w-full flex flex-col gap-4">
      <div
        className="relative flex flex-nowrap items-center justify-center"
        onClick={() => setShow((prev) => !prev)}
      >
        <hr className="grow border border-border/10" />
        <small className=" cursor-pointer text-[10px]">{year}</small>
        <media.FaCaretDown
          className={`${show ? "rotate-0" : "rotate-180"} cursor-pointer mx-1 transition-all text-xs`}
        />
        <hr className="grow border border-border/10" />
      </div>
      {show &&
        Object.entries(dates)
          .sort((a, b) => sortableDate(a[0]).localeCompare(sortableDate(b[0])))
          .map(([date, messages], index) => (
            <DayMessage
              date={date}
              messages={messages}
              key={`selectedUser/date/message/${index}`}
              selectedUser={selectedUser}
            />
          ))}
    </article>
  );
}
