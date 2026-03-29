import {useEffect} from 'react';
import {useNavigate} from 'react-router';
import AlgoliaSearch from '~/components/AlgoliaSearch';

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  searchKey: string;
  indexName: string;
};

export default function SearchOverlay({
  isOpen,
  onClose,
  appId,
  searchKey,
  indexName,
}: SearchOverlayProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function goToSearchPage(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    onClose();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-auto mt-6 w-[95%] max-w-6xl rounded-2xl bg-white shadow-2xl md:mt-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 md:p-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            Buscar produtos
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-xl text-neutral-600 transition hover:bg-neutral-100"
            aria-label="Fechar busca"
          >
            ✕
          </button>
        </div>

        <div className="p-4 md:p-5">
          <AlgoliaSearch
            appId={appId}
            searchKey={searchKey}
            indexName={indexName}
            mode="overlay"
            minQueryLength={3}
            maxPreviewHits={6}
            onNavigate={onClose}
            onSearchPageNavigate={goToSearchPage}
          />
        </div>
      </div>
    </div>
  );
}