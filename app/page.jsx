import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>This is my Next.js app</p>
      <Link
        href={`/kanban`}
      >
        Go to Kanban Board
      </Link>
    </div>
  );
}