import { useDispatch, useSelector } from "react-redux";
import { media } from "../../../assets/data/media";
import { useEffect, useRef, useState } from "react";
import readMedia from "../../../utils/read";
import { validateInput } from "../../../utils/CommonValidation";
import useApi from "../../../hooks/Api";
import { setUser } from "../../../redux/slices/UserSlice";
import toast from "react-hot-toast";
export default function Profile({ setToShow }) {
  const { sendRequest, loading } = useApi();
  const dispatch = useDispatch();
  const currUser = useSelector((store) => store.user.userInfo);
  const [user, setUsr] = useState({
    name: currUser.name,
    email: currUser.email,
    pic: currUser.pic,
    banner: currUser.banner,
    bio: currUser.bio,
  });
  useEffect(() => {
    setUsr({
      name: currUser.name,
      email: currUser.email,
      pic: currUser.pic,
      banner: currUser.banner,
      bio: currUser.bio,
    });
  }, [currUser]);
  const [save, setSave] = useState(false);
  const nameRef = useRef(null);
  const bioRef = useRef(null);
  useEffect(() => {
    if (
      user.name == currUser.name &&
      user.pic == currUser.pic &&
      user.bio == currUser.bio &&
      user.banner == currUser.banner
    ) {
      setSave(false);
    } else {
      setSave(true);
    }
  }, [user]);

  const Validation = () => {
    const { pic, bio, name, banner } = user;
    if (validateInput("name", name)) return false;
    if (pic && pic instanceof File && validateInput("image", pic, "pic"))
      return false;
    if (
      banner &&
      banner instanceof File &&
      validateInput("image", banner, "banner")
    )
      return false;
    console.log("Profile Validation done");
    return true;
  };

  const handleProfileChange = async () => {
    if (!Validation()) {
      return;
    }
    const { name, bio, banner, pic } = user;
    const toSend = { name, bio };
    if (banner instanceof File) {
      const baseImage = await readMedia(banner);
      toSend["banner"] = baseImage;
    }
    if (pic instanceof File) {
      const baseImage = await readMedia(pic);
      toSend["pic"] = baseImage;
    }
    await sendRequest("api/profile/update", "PATCH", toSend, {}, false).then(
      (result) => {
        if (result && result.success) {
          setUsr({
            name: "",
            email: " currUser.email",
            pic: null,
            banner: null,
            bio: "",
          });
          setSave(false);
          dispatch(setUser({ data: result.data.data }));
          toast.success(result?.data?.message);
        } else {
          const errorMessage =
            result?.error || result?.data?.message || "An error occurred";
          toast.error(errorMessage);
        }
      },
    );
  };
  return (
    <section className="relative flex flex-col w-full h-full bg-bgprimary/50 text-text overflow-x-hidden overscroll-y-auto">
      <div
        className="m-auto absolute top-2 left-2 rounded-full p-2 bg-bgprimary border border-border/20 text-text cursor-pointer z-1"
        onClick={() => setToShow(null)}
      >
        <media.BsChevronCompactLeft className="text-2xl" />
      </div>
      <article className="relative w-full flex flex-col gap-4">
        <article
          style={{
            backgroundImage: `url(${user && user.banner ? (user.banner instanceof File ? URL.createObjectURL(user.banner) : user.banner) : media.IDM})`,
          }}
          className="relative py-4 rounded-b-lg flex flex-col bg-center bg-cover bg-no-repeat"
        >
          <div className="relative self-center-safe overflow-hidden aspect-square rounded-full w-40 h-40 border border-border/30 ">
            {user.pic ? (
              <img
                src={
                  user.pic instanceof File
                    ? URL.createObjectURL(user.pic)
                    : user.pic
                }
                alt="user pic"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex w-full h-full items-center justify-center bg-bgprimary text-text uppercase">
                <strong>{user?.name.slice(0, 2)}</strong>
              </div>
            )}
            <div className="w-full absolute bottom-0 flex items-center justify-center p-2 bg-bgprimary/80 cursor-pointer border-t border-t-border/20">
              <label htmlFor="picChange" className="cursor-pointer">
                <media.MdEdit className="text-xl" />
              </label>
              <input
                type="file"
                name="picChange"
                id="picChange"
                className="hidden"
                accept="image/png, image/jpeg, image/webp,image/jpg"
                onChange={(e) =>
                  setUsr((prev) => ({ ...prev, pic: e.target.files[0] }))
                }
              />
            </div>
          </div>
          <div className="absolute top-2 right-2 m-auto rounded-full p-2 bg-bgprimary border border-border/20 text-text cursor-pointer">
            <label htmlFor="banner">
              <media.MdEdit className="cursor-pointer" />
            </label>
            <input
              type="file"
              name="banner"
              id="banner"
              className="hidden"
              onChange={(e) =>
                setUsr((prev) => ({ ...prev, banner: e.target.files[0] }))
              }
            />
          </div>
        </article>
        <article className="flex flex-col gap-4 p-4">
          <div className="flex self-center-safe relative px-5 max-w-full">
            <input
              ref={nameRef}
              type="text"
              className=" outline-none focus:outline-none text-2xl field-sizing-content min-w-12.5 "
              disabled
              placeholder="Your Name"
              value={user.name}
              onChange={(e) =>
                setUsr((prev) => ({ ...prev, name: e.target.value }))
              }
              onBlur={() => {
                if (nameRef.current) {
                  nameRef.current.disabled = true;
                }
              }}
            />
            <media.MdEdit
              className="absolute top-0 right-0 cursor-pointer"
              onClick={() => {
                if (nameRef.current) {
                  nameRef.current.disabled = false;
                  nameRef.current.focus();
                }
              }}
            />
          </div>
          <div className="flex self-center-safe relative px-5 max-w-full">
            <input
              ref={bioRef}
              type="text"
              className=" outline-none focus:outline-none field-sizing-content min-w-12.5 "
              disabled
              value={user.bio}
              placeholder="Your Bio"
              onChange={(e) =>
                setUsr((prev) => ({ ...prev, bio: e.target.value }))
              }
              onBlur={() => {
                if (bioRef.current) {
                  bioRef.current.disabled = true;
                }
              }}
            />
            <media.MdEdit
              className="absolute top-0 right-0 cursor-pointer"
              onClick={() => {
                if (bioRef.current) {
                  bioRef.current.disabled = false;
                  bioRef.current.focus();
                }
              }}
            />
          </div>
        </article>
        <hr className="w-full border border-border/20" />
      </article>
      {save && (
        <button
          disabled={!save}
          className="sticky bottom-2 right-2 self-end-safe m-4 px-4 py-1 rounded-full bg-primary flex gap-2 items-center"
          onClick={handleProfileChange}
        >
          Save {loading && <p className="spinner"></p>}
        </button>
      )}
    </section>
  );
}
