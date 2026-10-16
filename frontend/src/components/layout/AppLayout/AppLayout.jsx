import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './AppLayout.module.css';

/** Logged-in shell. */
export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Navbar variant="app" />
      <main className={styles.main}><Outlet /></main>
      <Footer tagline="A clearer view of your bowling." />
    </div>
  );
}
