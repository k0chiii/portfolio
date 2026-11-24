interface HeaderProps {
  brand: string;
  location: string;
}

export function Header({ brand, location }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand-mark" href="#top">
          <span>{brand}</span>
          <span className="brand-loc mono-figure">{location}</span>
        </a>

        <nav className="site-nav" aria-label="Primary">
          <a href="#index">
            <span className="nav-num mono-figure">1</span>
            <span>Index</span>
          </a>
          <a href="#links">
            <span className="nav-num mono-figure">2</span>
            <span>Elsewhere</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
