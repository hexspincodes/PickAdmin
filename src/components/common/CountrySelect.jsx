import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, POPULAR_COUNTRY_CODES, findCountryByCode, findCountryByName, flagSrc } from '../../constants/countries';

// Port of pick_frontend src/components/ui/CountrySelect.tsx — keep the two in sync.

export function Flag({ code, className = '' }) {
  return (
    <img
      src={flagSrc(code)}
      alt=""
      width={24}
      height={16}
      loading="lazy"
      className={`h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-black/10 ${className}`}
    />
  );
}

const POPULAR = POPULAR_COUNTRY_CODES.map(findCountryByCode).filter(Boolean);

/**
 * Searchable dropdown of every country with its flag.
 *   mode="name": value/onChange use the country name (e.g. nationality).
 *   mode="dial": value/onChange use the ISO code; the trigger shows flag + dialing code.
 */
export default function CountrySelect({ mode, value, onChange, id, placeholder = 'Select country', hasError = false, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const selected = mode === 'name' ? findCountryByName(value || '') : findCountryByCode(value);
  const isSelected = (c) => (selected ? c.code === selected.code : false);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        ...POPULAR.map((country, i) => ({ key: `popular-${country.code}`, country, group: i === 0 ? 'Popular' : undefined })),
        ...COUNTRIES.map((country, i) => ({ key: `all-${country.code}`, country, group: i === 0 ? 'All countries' : undefined })),
      ];
    }
    const digits = q.replace(/[^0-9]/g, '');
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || (digits && c.dial.replace('+', '').startsWith(digits)),
    ).map((country) => ({ key: `match-${country.code}`, country }));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const openList = () => {
    setQuery('');
    const current = POPULAR.findIndex(isSelected);
    setActive(current >= 0 ? current : 0);
    setOpen(true);
  };

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (country) => {
    onChange(mode === 'name' ? country.name : country.code);
    close();
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[active]) choose(options[active].country);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  const standalone = `w-full rounded-lg border px-3 py-2 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
  }`;

  return (
    <div ref={rootRef} className={`relative ${mode === 'dial' ? 'shrink-0' : ''}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openList();
          }
        }}
        className={`flex items-center gap-2 text-sm text-gray-900 outline-none ${mode === 'name' ? standalone : 'h-full pl-3 pr-2'}`}
      >
        {selected ? (
          <>
            <Flag code={selected.code} />
            <span className={mode === 'name' ? 'flex-1 truncate text-left' : 'tabular-nums'}>
              {mode === 'name' ? selected.name : selected.dial}
            </span>
          </>
        ) : (
          <span className="flex-1 truncate text-left text-gray-400">{mode === 'dial' ? 'Code' : value || placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ${
            mode === 'name' ? 'w-full min-w-64' : 'w-72'
          }`}
        >
          <div className="relative border-b border-gray-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder={mode === 'dial' ? 'Search country or code' : 'Search country'}
              aria-label="Search countries"
              aria-controls={listId}
              aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
              className="w-full rounded-lg bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {options.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">No countries found</li>}
            {options.map((option, index) => {
              const { country } = option;
              const chosen = isSelected(country);
              return (
                <li key={option.key} role="presentation">
                  {option.group && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{option.group}</p>
                  )}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={chosen}
                    data-index={index}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(country)}
                    className={`mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm ${
                      index === active ? 'bg-brand-50' : ''
                    } ${chosen ? 'font-semibold text-brand-700' : 'text-gray-800'}`}
                  >
                    <Flag code={country.code} />
                    <span className="flex-1 truncate">{country.name}</span>
                    {mode === 'dial' && <span className="text-xs tabular-nums text-gray-400">{country.dial}</span>}
                    {chosen && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
