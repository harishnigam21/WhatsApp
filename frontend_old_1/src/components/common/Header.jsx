import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// Note: Ensure your data path is correct
import { list } from "../../assets/data/navlist"; 

export default function Header() {
  const [openNav, setOpenNav] = useState(false);
  const headerRef = useRef(null);
  const menuIconRef = useRef(null);
  const lastScrollY = useRef(0);

  // Effect 1: Handle the Mobile Menu Icon Animation (Optional class toggling)
  useEffect(() => {
    if (menuIconRef.current) {
      openNav
        ? menuIconRef.current.classList.add("myNav")
        : menuIconRef.current.classList.remove("myNav");
    }
  }, [openNav]);

  // Effect 2: Handle the Hide/Show on Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;

      const currentScrollY = window.scrollY;

      // Logic: If scrolling down and past 80px, hide. If scrolling up, show.
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        // Hide Header
        headerRef.current.style.transform = "translateY(-100%)";
      } else {
        // Show Header
        headerRef.current.style.transform = "translateY(0)";
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      // Added: fixed, top-0, transition-transform, and duration-300
      className={`sticky top-0 left-0 w-full py-2 px-8 flex gap-8 items-center z-50 border-b border-border/10 transition-transform duration-300 ease-in-out ${
        openNav ? "bg-bgprimary" : "bg-transparent"
      } md:bg-transparent backdrop-blur-sm`}
    >
      {/* MOBILE VIEW */}
      <div className="flex md:hidden items-center justify-between w-full">
        <div
          ref={menuIconRef}
          className="relative flex flex-col justify-center w-8 h-8 gap-2 cursor-pointer"
          onClick={() => setOpenNav(!openNav)}
        >
          <p className={`w-8 border-b-4 border-primary rounded-r-md transition-all duration-500 ${openNav ? 'rotate-45 translate-y-2.5' : ''}`}></p>
          <p className={`w-6 border-b-4 border-tertiary rounded-r-md transition-all duration-500 ${openNav ? 'opacity-0' : ''}`}></p>
          <p className={`w-8 border-b-4 border-secondary rounded-r-md transition-all duration-500 ${openNav ? '-rotate-45 -translate-y-2.5' : ''}`}></p>
        </div>

        <Link to={list[0].path}>
          <img
            className="min-w-14 h-14 object-center object-cover"
            src={list[0].src}
            alt={list[0].name}
          />
        </Link>

        {/* Mobile Dropdown */}
        {openNav && (
          <article className="fixed top-18 left-0 bg-bgprimary flex flex-col items-center p-4 gap-8 rounded-b-xl border-b border-r w-52 shadow-xl">
            {list.slice(1).map((item, index) => (
              <Link
                className="font-bold text-tertiary uppercase hover:text-primary transition-colors"
                to={item.path}
                key={`min/navlist/${index}`}
                onClick={() => setOpenNav(false)}
              >
                {item.name}
              </Link>
            ))}
          </article>
        )}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex items-center w-full">
        <Link to={list[0].path} className="pr-8">
          <img
            className="min-w-14 h-14 object-center object-cover"
            src={list[0].src}
            alt={list[0].name}
          />
        </Link>
        <nav className="flex gap-8 items-center grow">
          {list.slice(1).map((item, index) => (
            <Link
              className="font-bold text-tertiary uppercase hover:text-primary transition-colors"
              to={item.path}
              key={`max/navlist/${index}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}