import Link from "next/link";

export default function Kanban() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>Choose sort by group or activity</p>
      <p>*click on any of below</p> <br />
      <Link
        href={`/kanban/grp`}
      >
        Go to Group Selection
      </Link> <br />
      <Link
        href={`/kanban/act`}
      >
        Go to Activity Selection
      </Link>
    </div>
  );
}