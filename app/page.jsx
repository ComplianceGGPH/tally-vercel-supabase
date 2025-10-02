import Link from "next/link";

export default function Home() {
  return (
    <div>

<Link href="/kanban" passHref>
  <div className="box text-center" style={{ cursor: 'pointer' }}>
    Go to Kanban Board
  </div>
</Link>
    </div>
  );
}