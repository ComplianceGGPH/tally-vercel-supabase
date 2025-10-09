import Link from "next/link";
import Image from "next/image";

export default function Kanban() {
  return (
    <div className="indemnity-container">

      <div className="logo-container items-center">
        {[
          "/logo/ggp.png",
          "/logo/gct.png",
          "/logo/pwap.png",
          "/logo/lrc.png",
          "/logo/botani.png",
          "/logo/glow.png",
        ].map((src, index) => (
          <div key={index} className="logo-box">
            <Image src={src} alt={`Logo ${index + 1}`} width={120} height={100} />
          </div>
        ))}
      </div>

      <h1 className="font-bold">INDEMNITY FORM</h1>
      <p>Choose sort by group or activity</p>
      
      <div className="container">
        <Link href={`/kanban/grp`} passHref >
          <div className="box text-center">
              Group Selection
          </div >
        </Link>

        <Link href={`/kanban/act`} passHref >
          <div className="box text-center">
            Activity Selection
          </div>
        </Link>

        <Link href={`/`} passHref >
          <div className="shortbox text-center">
            Home Page
          </div>
        </Link>
      </div>

    </div>
  );
}