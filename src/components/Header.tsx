interface HeaderProps {
  brand: string;
}

export function Header({ brand }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand-mark" href="#top">
          {brand}
        </a>

        <nav className="site-nav" aria-label="Primary">
          <a href="#interests">Interests</a>
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#links">Links</a>
        </nav>
      </div>
    </header>
  );
}
