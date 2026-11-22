import { Contact, setSelectedContactLoading } from "@/redux/slices/ChatSlice";
import { useAppDispatch } from "@/redux/Store";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ContactList({
  item,
  setShowContact,
}: {
  item: Contact;
  setShowContact: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <div
      onClick={() => {
        dispatch(setSelectedContactLoading(true));
        router.push(`/c=${item._id}`);
        setShowContact(false);
      }}
      className="flex p-3 gap-4 rounded-xl items-center cursor-pointer hover:bg-bgsec active:bg-bgsec transition-all"
    >
      <div className="rounded-full overflow-hidden size-11 bg-pri/70 text-txpri">
        {item.pic ? (
          <Image
            loading="eager"
            src={item.pic}
            width={10}
            height={10}
            alt="user pic"
            className="size-full"
          />
        ) : (
          <div className="size-full p-1 flex items-center justify-center uppercase font-bold">
            {item.name.slice(0, 2)}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between">
        <p className="">{item.name}</p>
      </div>
    </div>
  );
}
