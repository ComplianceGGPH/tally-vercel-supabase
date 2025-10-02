import Link from "next/link";

export default function Home() {
  return (
    <div>

      <div>
        <h1>Welcome to GGPH Kanban Board</h1>
        <p>Please choose how you want to sort the participants</p>
        <p>*click on any of below</p> <br />
      </div>

      <Link href="/kanban" passHref>
        <div className="box text-center" style={{ cursor: 'pointer' }}>
          Go to Kanban Board
        </div>
      </Link>
    </div>
  );
}