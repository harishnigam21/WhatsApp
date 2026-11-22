"use client";
import {
  clearSelectedContact,
  setRightPartActive,
} from "@/redux/slices/ChatSlice";
import { setInviteTemplate } from "@/redux/slices/LayoutSlice";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InviteContact() {
  const [phone, setPhone] = useState<boolean>(false);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const [mounted, setMounted] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    setMounted(true);

    const timer = setInterval(() => {
      setPhone((prev) => !prev);
    }, 2000);

    return () => {
      clearInterval(timer);
      dispatch(setInviteTemplate(false));
    };
  }, []);

  return (
    mounted && (
      <section
        className={`${mainLayout.rightpart ? "w-full grow flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)]" : "hidden"} p-4`}
      >
        <div
          className="absolute top-1 left-1 cursor-pointer rounded-full p-1 hover:bg-borderhl/40 active:bg-borderhl/40 md:hidden"
          onClick={() => {
            dispatch(setRightPartActive(false));
            dispatch(clearSelectedContact());
            router.replace("/");
          }}
        >
          <ArrowLeft />
        </div>
        <div className="w-full max-w-87 rounded-2xl p-4 flex flex-col items-center bg-bgpri/25">
          <div className="w-50 h-35 mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 240 190"
              width="240"
              height="190"
              fill="none"
            >
              <defs>
                <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="var(--color-pri)" />
                  <stop offset="1" stopColor="var(--color-pri)" />
                </linearGradient>
              </defs>

              {/* <!-- Diagonal infinity loop --> */}
              <g transform="rotate(-38 100 90)">
                <path
                  d="M28 90
         C28 48 76 48 100 90
         C124 132 172 132 172 90
         C172 48 124 48 100 90
         C76 132 28 132 28 90"
                  stroke="url(#blue)"
                  strokeWidth="3"
                  strokeDasharray="6 5"
                  opacity=".8"
                />
              </g>

              {/* <!-- Add Contact icon --> */}
              <g
                stroke="url(#blue)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              >
                <circle
                  cx="84"
                  cy="65"
                  r="17"
                  className="animate-light-bounce"
                ></circle>

                <path
                  d="M50 133
             C50 108 65 96 84 96
             C103 96 118 108 118 133"
                />

                <path
                  d="M135 106 H169 M152 89 V123"
                  className="animate-pulse"
                ></path>
              </g>

              {/* <!-- Flying plane --> */}
              <g transform="rotate(-38 100 90)">
                <g>
                  <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path="M28 90
              C28 48 76 48 100 90
              C124 132 172 132 172 90
              C172 48 124 48 100 90
              C76 132 28 132 28 90"
                  />

                  <path
                    d="M-10 -6 L13 0 L-10 6 L-5 0 Z"
                    fill="var(--color-pri)"
                    stroke="var(--color-pri)"
                  />
                </g>
              </g>
            </svg>
          </div>
          <p className="text-xl text-center">Not Registered</p>
          <small className="text-txpri/75 text-[14px] text-center mt-1">
            To start conversation, you have to send Invitation to this Contact.
          </small>
          <button className="bg-pri/50 rounded-full py-1 px-3 text-sm font-medium tracking-tighter mt-6 cursor-pointer">
            Invite
          </button>
        </div>
      </section>
    )
  );
}
