import { Link } from 'react-router-dom';
import { Search, Bell, Mail, HelpCircle, LogOut } from 'lucide-react';

export function Header() {
  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Esquerda: Breadcrumbs */}
      <div className="flex-1">
      </div>

      {/* Direita: Busca e Ícones */}
      <div className="flex items-center gap-6">
        {/* Barra de Pesquisa */}
        <div className="relative w-96">
          <input
            type="text"
            placeholder="Buscar por militar, curso, ocorrência..."
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-militar-light focus:border-transparent transition-all"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>

        {/* Ícones de Ação */}
        <div className="flex items-center gap-4 text-gray-500">
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Mail size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Divisor */}
        <div className="w-px h-8 bg-gray-200"></div>

        {/* Logout */}
        <Link to="/login" className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
            <LogOut size={16} />
          </div>
        </Link>
      </div>
    </header>
  );
}
