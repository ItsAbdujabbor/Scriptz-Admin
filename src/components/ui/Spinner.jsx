import "./Spinner.css";

export default function Spinner({ size = 20 }) {
  return (
    <span
      className="ui-spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.floor(size / 10)) }}
      aria-label="Loading"
    />
  );
}
