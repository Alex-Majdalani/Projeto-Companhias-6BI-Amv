import React from 'react';
import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Página Inicial</Link></li>
        <li><Link to="/sgte/aditamento">Aditamento</Link></li>
        <li><Link to="#">Cmt Cia</Link></li>
        <li><Link to="/sgte">Sargenteante</Link></li>
        <li><Link to="#">Enc Mat</Link></li>
        <li><Link to="#">Furriel</Link></li>
        <li><Link to="/login">Login</Link></li>
      </ul>
    </nav>
  );
}
