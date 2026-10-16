import { cn } from '@/utils/cn';
import styles from './DataTable.module.css';

/**
 * Standard table container and table elements for PitchIQ.
 */
export function Table({ children, className, ...rest }) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <table className={styles.table} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, className, ...rest }) {
  return <thead className={cn(styles.thead, className)} {...rest}>{children}</thead>;
}

export function Tbody({ children, className, ...rest }) {
  return <tbody className={cn(styles.tbody, className)} {...rest}>{children}</tbody>;
}

export function Tr({ children, className, ...rest }) {
  return <tr className={cn(styles.tr, className)} {...rest}>{children}</tr>;
}

export function Th({ children, className, ...rest }) {
  return <th className={cn(styles.th, className)} {...rest}>{children}</th>;
}

export function Td({ children, className, ...rest }) {
  return <td className={cn(styles.td, className)} {...rest}>{children}</td>;
}

export default Table;

