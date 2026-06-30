import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { Search } from 'lucide-react';

interface MilitarAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onSelect: (militar: any) => void;
  militares: any[];
  selectedPG?: string;
  setSelectedPG?: (pg: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function renderMilitarName(militar: any) {
  const nomeCompleto = militar.nome_completo || militar.nome || '';
  const nomeGuerra = militar.nomeGuerra || militar.nome_guerra || '';

  if (!nomeGuerra) {
    return <span className="font-medium text-gray-900">{nomeCompleto}</span>;
  }

  const words = nomeGuerra.split(/\s+/).filter((w: string) => w.trim().length > 0);
  if (words.length === 0) {
    return <span className="font-medium text-gray-900">{nomeCompleto}</span>;
  }

  const escapedWords = words.map((w: string) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = nomeCompleto.split(regex);

  return (
    <span>
      {parts.map((part: string, index: number) => 
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <strong key={index} className="font-bold text-militar-main underline decoration-2 decoration-militar-light">
            {part}
          </strong>
        ) : (
          <span key={index} className="font-medium text-gray-600">
            {part}
          </span>
        )
      )}
    </span>
  );
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function MilitarAutocomplete({
  label = 'Nome do Militar',
  placeholder = 'Nome ou P/G...',
  value,
  onChange,
  onSelect,
  militares,
  selectedPG,
  setSelectedPG,
  disabled = false,
  required = false,
  className = '',
}: MilitarAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (m: any) => {
    const formattedVal = `${m.posto} ${m.nomeGuerra || m.nome_guerra || m.nome}`;
    onChange(formattedVal);
    onSelect(m);
    if (setSelectedPG) {
      setSelectedPG(m.posto);
    }
    setShowSuggestions(false);
  };

  const search = normalizeText(value);
  const filteredMilitares = militares.filter(m => {
    if (selectedPG && m.posto !== selectedPG) return false;
    return normalizeText(`${m.posto} ${m.nome}`).includes(search) ||
      (m.nome_completo && normalizeText(m.nome_completo).includes(search)) ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra).includes(search)) ||
      (m.nome_guerra && normalizeText(m.nome_guerra).includes(search));
  });

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        disabled={disabled}
        required={required}
      />
      {!disabled && showSuggestions && filteredMilitares.length > 0 && (
        <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filteredMilitares.map((m) => (
            <div
              key={m.id}
              onMouseDown={() => handleSuggestionClick(m)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
            >
              <span>
                <span className="text-gray-400 mr-2 text-xs font-semibold uppercase">{m.posto}</span>
                {renderMilitarName(m)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
