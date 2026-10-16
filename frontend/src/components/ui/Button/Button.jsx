import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Button.module.css';

/**
 * Single source of truth for every button/CTA in the app.
 * variant: primary | secondary | ghost | gradient
 * size: md | lg
 * Pass `to` to render a router link, `href` for an external link.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  arrow = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  to,
  href,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const classes = cn(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.full,
    className,
  );
  const content = (
    <>
      <span>{loading ? 'Please wait…' : children}</span>
      {arrow && !loading && <ArrowRight size={16} aria-hidden="true" />}
    </>
  );

  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={classes} {...rest}>{content}</a>;
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
