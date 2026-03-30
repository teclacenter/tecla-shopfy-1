import {MagnifyingGlassIcon} from '@phosphor-icons/react';
import {useEffect, useState} from 'react';
import {useSearchBox} from 'react-instantsearch';

type Props = {
  minLength?: number;
  autoFocus?: boolean;
  initialValue?: string;
  placeholder?: string;
  onSubmit?: (query: string) => void;
  onValueChange?: (query: string) => void;
};

export default function AlgoliaSearchBox({
  minLength = 3,
  autoFocus = false,
  initialValue = '',
  placeholder = 'Buscar produtos, marcas e muito mais...',
  onSubmit,
  onValueChange,
}: Props) {
  const {refine} = useSearchBox();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);

    const trimmed = initialValue.trim();

    if (trimmed.length >= minLength) {
      refine(trimmed);
    } else {
      refine('');
    }

    onValueChange?.(initialValue);
  }, [initialValue, minLength, refine, onValueChange]);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    onValueChange?.(nextValue);

    const trimmed = nextValue.trim();

    if (trimmed.length >= minLength) {
      refine(trimmed);
    } else {
      refine('');
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = value.trim();
    if (!trimmed || trimmed.length < minLength) return;

    refine(trimmed);
    onSubmit?.(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />

      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-full border border-neutral-300 bg-white pl-12 pr-5 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
      />
    </form>
  );
}