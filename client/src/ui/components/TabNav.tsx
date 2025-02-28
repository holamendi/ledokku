import cx from 'classnames';
import { Link, LinkProps } from 'react-router-dom';

interface TabNavProps {
  children?: React.ReactNode;
  className?: string;
}

export const TabNav = ({ children, className }: TabNavProps) => (
  <nav className={cx('flex space-x-5 text-sm leading-5', className)}>
    {children}
  </nav>
);

interface TabNavLinkProps extends LinkProps {
  children?: React.ReactNode;
  className?: string;
  selected?: boolean;
}

export const TabNavLink = ({
  children,
  className,
  selected,
  ...props
}: TabNavLinkProps) => (
  <Link
    {...props}
    className={cx(
      'py-3 px-0.5 transition-colors ease-in-out duration-150',
      {
        'text-gray-500 hover:text-black ': !selected,
        '-mb-px border-b-2 border-black text-black': selected,
      },
      className
    )}
  >
    {children}
  </Link>
);
