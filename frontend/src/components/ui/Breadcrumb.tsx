import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      <Link to="/" className="hover:text-militar-main transition-colors">Início</Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-gray-400" />
          {item.to ? (
            <Link to={item.to} className="hover:text-militar-main transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
