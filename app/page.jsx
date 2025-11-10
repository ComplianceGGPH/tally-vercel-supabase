import Image from "next/image";
import Link from "next/link";
import styles from './styles/Home.module.css';
import IndemnityDownload from '@/components/IndemnityDownload'

export default function Home() {
  return (
    <div className={`main-page ${styles['bg-section']}`}>
      <div className="text-center">
        <Image src="/logo/ggph.png" alt="GGPH Logo" width={500} height={150} />
        <h1>Welcome to GGPH Board</h1> <br />
      </div>

      <Link href="/kanban" passHref>
        <div className="box text-center" style={{ cursor: 'pointer' }}>
          Indemnity Form
        </div>
      </Link>
    </div>
  );
}