export default function Loading({ width }) {
  return (
    <div className="flex items-center justify-center absolute top-0 left-0 w-screen h-screen bg-bgprimary">
      <p
        style={{ width: width || "100px", height: width || "100px" }}
        className="spinner"
      ></p>
    </div>
  );
}
