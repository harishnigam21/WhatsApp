import { useSelector } from "react-redux";
import { media } from "../../../assets/data/media";
import ForYouRequest from "./ForYouRequest";
import { useState } from "react";
export default function ForYou() {
  const requests = useSelector((store) => store.user.request);
  const user = useSelector((store) => store.user.userInfo);
  const [show, setShow] = useState(true);
  const filteredRequest = requests.filter(
    (item) => item.receiver_id._id == user._id,
  );
  return (
    <article className="flex flex-col">
      <div
        className="flex items-center w-full whitespace-nowrap cursor-pointer"
        onClick={() => setShow((prev) => !prev)}
      >
        <strong className="p-2">for you</strong>
        <media.FaCaretDown
          className={`cursor-pointer transition-all ${show ? "rotate-180" : "rotate-0"}`}
        />
        <hr className="w-full border border-border/10" />
      </div>
      <article className={` flex-col gap-4 p-2 ${show ? "flex" : "hidden"}`}>
        {filteredRequest.length > 0 ? (
          filteredRequest.map((item, index) => (
            <ForYouRequest
              key={`forYou/request/${index}`}
              item={item}
              index={index}
            />
          ))
        ) : (
          <small className="text-red-500">No pending Incoming requests !</small>
        )}
      </article>
    </article>
  );
}
