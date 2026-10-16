import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './PublicLayout.module.css';

export default function PublicLayout() {
  return (
    <div className={styles.shell}>
      <Navbar variant="public" />
      <main className={styles.main}><Outlet /></main>
      <Footer />
    </div>
  );
}
