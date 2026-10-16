import { Container, SectionHeader } from '@/components/ui';
import styles from './AuthLayout.module.css';

/** Split screen: optional SectionHeader at top, photo + dark caption on the left, form on the right. */
export default function AuthLayout({
  eyebrow,
  title,
  description,
  image,
  imageAlt = '',
  caption,
  children,
}) {
  return (
    <Container className={styles.container}>
      {(eyebrow || title || description) && (
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          className={styles.header}
        />
      )}
      <div className={styles.grid}>
        <aside className={styles.visual}>
          <div
            className={styles.photo}
            style={
              image
                ? {
                    backgroundImage: `url(${image}), linear-gradient(160deg, #3b6b4f, #1f3d2e)`,
                  }
                : undefined
            }
            role="img"
            aria-label={imageAlt}
          />
          <div className={styles.caption}>{caption}</div>
        </aside>
        <section className={styles.formWrap}>{children}</section>
      </div>
    </Container>
  );
}
