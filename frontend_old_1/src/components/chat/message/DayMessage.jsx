import SenderMessage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import { useState } from "react";
import { media } from "../../../assets/data/media";

export default function DayMessage({ date, messages, selectedUser }) {
  const [show, setShow] = useState(true);

  return (
    <article className="relative w-full flex flex-col gap-4">
      <div
        className=" sticky top-0 flex flex-nowrap items-center justify-center z-10"
        onClick={() => setShow((prev) => !prev)}
      >
        <hr className="grow border border-border/10" />
        <small className="cursor-pointer bg-primary font-bold text-black rounded-full py-0.5 px-3 text-[10px]">
          {date.slice(0, 5)}
        </small>
        <media.FaCaretDown
          className={`${show ? "rotate-0" : "rotate-180"} cursor-pointer transition-all text-xs`}
        />
        <hr className="grow border border-border/10" />
      </div>
      {show &&
        Array.isArray(messages) &&
        messages.map((msg, index) =>
          msg.receiver_id == selectedUser._id ? (
            <SenderMessage
              key={`selectedUser/message/${index}`}
              msg={msg}
              selectedUser={selectedUser}
            />
          ) : (
            <ReceiverMessage key={`selectedUser/message/${index}`} msg={msg} />
          ),
        )}
    </article>
  );
}
