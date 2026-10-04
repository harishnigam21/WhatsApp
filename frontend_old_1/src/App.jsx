import Footer from "./components/common/Footer";
import Header from "./components/common/Header";
import { Outlet } from "react-router-dom";
export default function App() {
  return (
    <main
      className="flex flex-col w-full h-full"
    >
      <Header />
      <section className="flex flex-col justify-center items-center grow">
        <Outlet />
      </section>
      {/* <Footer /> */}
    </main>
  );
}
