import Link from "next/link";
import styles from './preview.module.scss';

export function PreviewButton() {
  return (
    <aside className={styles.container} >
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  )
}