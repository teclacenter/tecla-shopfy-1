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
      className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative mx-auto mt-[48px] w-[96%] max-w-7xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.22)] md:mt-[120px] xl:mt-[138px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-neutral-200 px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Busca
              </p>
              <h2 className="mt-1 text-xl font-semibold text-neutral-950 md:text-2xl">
                Encontre o produto ideal
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-xl text-neutral-600 transition hover:bg-neutral-100"
              aria-label="Fechar busca"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="max-h-[78vh] overflow-y-auto px-5 py-6 md:px-8 md:pb-8 md:pt-10"
          onTouchMove={() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }}
        >
          <AlgoliaSearch
            appId={appId}
            searchKey={searchKey}
            indexName={indexName}
            mode="overlay"
            minQueryLength={3}
            maxPreviewHits={8}
            onNavigate={onClose}
            onSearchPageNavigate={goToSearchPage}
          />
        </div>
      </div>
    </div>
  );
}