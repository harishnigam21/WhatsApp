"use client";
//TODO:Remianing, making this component responsive for small screen
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppIcon from "../WhatsAppIcon";
import Globe3D from "./Globe";

// Floating animation configuration for individual items
const floatAnimation = (delay: number, duration: number, yRange = [-6, 6]) => ({
  animate: {
    y: yRange,
    transition: {
      duration: duration,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut" as const,
      delay: delay,
    },
  },
});

export default function AnimatedLogo() {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const time = showLogo ? 1000 : 3500;
    const interval = setInterval(() => {
      setShowLogo((prev) => !prev);
    }, time);

    return () => clearInterval(interval);
  }, [showLogo]);

  return (
    <div className="relative flex items-center justify-center w-90 h-90 rounded-xl select-none">
      {!showLogo ? (
        <div className="">
          <AnimatePresence mode="wait">
            <motion.div
              key="cluster"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0, rotate: -20 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="relative size-100 scale-80 min-[480]:scale-100"
            >
              {/* Background Chat Bubble 1 (Top Left) */}
              <motion.div
                {...floatAnimation(0, 3.5, [-5, 5])}
                className="absolute top-4 left-5"
              >
                <svg
                  className="rotate-y-180 rotate-z-10"
                  width="250"
                  height="180"
                  viewBox="0 0 250 180"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="
              M 92 25
        
              C 59 25 35 52 35 85
        
              L 35 111
        
              C 35 142 60 160 92 160
        
              L 184 160
        
              C 215 160 232 137 232 105
        
              L 232 61
        
              L 247 40
        
              C 250 35 247 25 239 25
        
              Z
            "
                    fill="#fbf5eb"
                    stroke="#225B5A"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>

              {/* Phone Icon */}
              <motion.div
                {...floatAnimation(0.3, 3, [-5, 5])}
                className="absolute top-5 left-8 w-15 h-15 flex items-center justify-center rounded-[20px]"
              >
                <svg
                  className="scale-125 text-black fill-pri"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.157-.44.009-.927.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </motion.div>

              {/* Globe Icon */}
              <motion.div
                {...floatAnimation(0.6, 4, [-5, 5])}
                className={`absolute top-10 right-20 ${showLogo && "size-0 overflow-hidden transition-all"}`}
              >
                <Globe3D size={150} />
              </motion.div>

              {/* Foreground Chat Bubble 2 (Center Right) */}
              <motion.div
                {...floatAnimation(0.2, 2, [-5, 5])}
                className="absolute bottom-25 right-12.5  flex flex-col justify-center gap-3 px-6 z-10"
              >
                <svg
                  className="rotate-z-10"
                  width="250"
                  height="180"
                  viewBox="0 0 250 180"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="bubbleGradient"
                      x1="0"
                      y1="0"
                      x2="250"
                      y2="180"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#E6FBD7" />
                      <stop offset="100%" stopColor="#F1FDE9" />
                    </linearGradient>
                  </defs>

                  <path
                    d="
              M 92 25
        
              C 59 25 35 52 35 85
        
              L 35 111
        
              C 35 142 60 160 92 160
        
              L 184 160
        
              C 215 160 232 137 232 105
        
              L 232 61
        
              L 247 40
        
              C 250 35 247 25 239 25
        
              Z
            "
                    fill="url(#bubbleGradient)"
                    stroke="#225B5A"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  <line
                    x1="84"
                    y1="78"
                    x2="202"
                    y2="78"
                    stroke="#225B5A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  <line
                    x1="84"
                    y1="113"
                    x2="169"
                    y2="113"
                    stroke="#225B5A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>

              {/* Heart Icon */}
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{
                  type: "tween",
                  bounce: 0.25,
                  duration: 1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.2,
                }}
                className="absolute bottom-30 left-20 w-13.75 h-13.75 flex items-center justify-center -rotate-20 z-20"
              >
                <svg
                  className=" text-black fill-[#04d09b]"
                  stroke="currentColor"
                  strokeWidth={0.5}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </motion.div>

              {/* Padlock Icon */}
              <motion.div
                className="absolute bottom-5 right-14 flex flex-col items-center z-20"
                animate={{
                  rotate: [-12, 10, -12],
                  y: [-5, 5],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse" as const,
                    ease: "easeInOut" as const,
                    delay: 0.2,
                  },
                }}
              >
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 1080 976"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* <!-- Background --> */}
                  <rect width="1080" height="976" fill="transparent" />

                  {/* <!-- Lock --> */}
                  <g
                    fill="#32d67f"
                    stroke="#174D35"
                    strokeWidth="14"
                    strokeLinejoin="round"
                    filter="url(#shadow)"
                  >
                    {/* <!-- Shackle --> */}
                    <path
                      d="
                M 420 426
                L 420 347
                C 420 275 475 220 544 220
                C 613 220 668 275 668 347
                L 668 426
                L 605 426
                L 605 347
                C 605 311 578 281 544 281
                C 510 281 483 311 483 347
                L 483 426
                Z
              "
                    />

                    {/* <!-- Main lock body --> */}
                    <path
                      d="
                M 416 422
                H 672
                C 714 422 749 457 749 500
                V 662
                C 749 707 713 742 669 742
                H 411
                C 367 742 335 707 335 662
                V 500
                C 335 457 369 422 416 422
                Z
              "
                    />

                    {/* <!-- Keyhole --> */}
                    <path
                      d="
                M 544 478
                C 516 478 493 500 493 528
                C 493 546 503 561 518 569
                L 472 674
                H 616
                L 570 569
                C 585 561 595 546 595 528
                C 595 500 572 478 544 478
                Z
              "
                      fill="none"
                    />
                  </g>
                </svg>
              </motion.div>

              {/* wrapping up */}
              <motion.div
                {...floatAnimation(0.2, 2, [-5, 5])}
                className="absolute bottom-25 right-12.5 flex flex-col justify-center gap-3 px-6 z-20 "
              >
                <svg
                  className="rotate-z-10"
                  width="250"
                  height="180"
                  viewBox="0 0 250 180"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="
            M 205 156
            C 215 156 232 137 232 105
            L 205 156
            Z
          "
                    fill="#ecfce1"
                    stroke="none"
                  />
                  <path
                    d="
            M 205 156
            C 215 156 232 137 232 105
          "
                    fill="none"
                    stroke="#225B5A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          key="whatsapp"
          initial={{ opacity: 1, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex items-center justify-center"
        >
          {/* Customizable Mock WhatsApp Badge */}
          <div className="size-35">
            <WhatsAppIcon />
          </div>
        </motion.div>
      )}
    </div>
  );
}
