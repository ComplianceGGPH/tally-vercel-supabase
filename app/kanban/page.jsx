import Link from "next/link";

export default function Kanban() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>Choose sort by group or activity</p>
      <p>*click on any of below</p> <br />

        <Link href={`/kanban/grp`} passHref >
          <div className="box text-center">
              Go to Group Selection
          </div >
        </Link>

        <Link href={`/kanban/act`} passHref >
          <div className="box text-center">
            Go to Activity Selection
          </div>
        </Link>

        <br />

        <Link href={`/`} passHref >
          <div className="box text-center">
            Back to Home Page
          </div>
        </Link>

    </div>
  );
}