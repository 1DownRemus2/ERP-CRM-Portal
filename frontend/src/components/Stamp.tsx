export default function Stamp({ status }: { status: string }) {
  const className =
    status === "CONFIRMED" || status === "ACTIVE"
      ? "stamp stamp-confirmed"
      : status === "CANCELLED" || status === "INACTIVE"
      ? "stamp stamp-cancelled"
      : "stamp stamp-draft";

  return <span className={className}>{status}</span>;
}
