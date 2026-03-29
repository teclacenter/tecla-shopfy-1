import {useState} from 'react';
import {useSearchBox} from 'react-instantsearch';

type Props = {
  minLength?: number;
  autoFocus?: boolean;
};

export default function AlgoliaSearchBox({
  minLength = 3,
  autoFocus = false,
}: Props) {
  const {refine} = useSearchBox();
  const [value, setValue] = useState('');

  function handleChange(nextValue: string) {
    setValue(nextValue);

    if (nextValue.trim().length >= minLength) {
      refine(nextValue);
    } else {
      refine('');
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar produtos, marcas e muito mais..."
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-neutral-500"
      />
    </div>
  );
}