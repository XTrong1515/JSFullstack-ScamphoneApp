import { useEffect, useMemo, useState } from 'react';
import { Loader2, PackageSearch } from 'lucide-react';
import { SearchBar } from '../SearchBar';
import { FilterSidebar } from '../FilterSidebar';
import { ProductCard } from '../ProductCard';
import { Button } from '../ui/button';
import { SuggestedProductsCarousel } from '../SuggestedProductsCarousel';
import { searchService, SearchFilters, SearchResult } from '../../services/searchService';

interface SearchResultsPageProps {
  query: string;
  onPageChange: (page: string) => void;
  onSearch: (query: string) => void;
  onAddToCart: (product: any) => void;
  onProductClick: (product: any) => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  page: 1,
  limit: 20,
  sortBy: 'newest'
};

export function SearchResultsPage({
  query,
  onPageChange,
  onSearch,
  onAddToCart,
  onProductClick
}: SearchResultsPageProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [query]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!query?.trim()) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await searchService.searchProducts(query, filters);
        setResults(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tìm kiếm sản phẩm lúc này');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, filtersKey]);

  const handleFilterChange = (updatedFilters: SearchFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
      page: updatedFilters.page ?? 1
    }));
  };

  const handleManualSearch = (value: string) => {
    if (!value.trim()) return;
    onSearch(value.trim());
  };

  const goHome = () => onPageChange('home');

  if (!query?.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <PackageSearch className="w-16 h-16 text-blue-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Nhập từ khóa để bắt đầu tìm kiếm</h1>
        <p className="text-gray-600 mb-6">Ví dụ: "xiaomi 17", "iphone 15 pro max"</p>
        <div className="w-full max-w-xl">
          <SearchBar onSearch={handleManualSearch} />
        </div>
        <Button variant="link" className="mt-4" onClick={goHome}>
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Kết quả cho</p>
                <h1 className="text-2xl font-bold text-gray-900">"{query}"</h1>
                <p className="text-gray-600 mt-1">
                  {results?.total ?? 0} sản phẩm được tìm thấy
                </p>
              </div>
              <div className="w-full md:max-w-xl">
                <SearchBar onSearch={handleManualSearch} />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-72 flex-shrink-0">
              <FilterSidebar
                key={query}
                initialFilters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600">Đang tìm kiếm sản phẩm...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <p className="text-red-500 font-medium">{error}</p>
                  <Button className="mt-4" onClick={() => onSearch(query)}>
                    Thử lại
                  </Button>
                </div>
              ) : results && results.products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={{
                          id: product._id,
                          name: product.name,
                          price: product.price,
                          originalPrice: product.originalPrice,
                          image: product.image,
                          rating: product.rating,
                          discount: product.discount,
                          isHot: product.isHot
                        }}
                        onAddToCart={onAddToCart}
                        onProductClick={onProductClick}
                      />
                    ))}
                  </div>

                  {results.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 bg-white rounded-2xl shadow-sm p-4">
                      <Button
                        variant="outline"
                        disabled={(filters.page || 1) <= 1}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: Math.max(1, (prev.page || 1) - 1)
                          }))
                        }
                      >
                        Trang trước
                      </Button>
                      <p className="text-sm text-gray-600">
                        Trang {filters.page || 1} / {results.totalPages}
                      </p>
                      <Button
                        variant="outline"
                        disabled={(filters.page || 1) >= results.totalPages}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: Math.min(results.totalPages, (prev.page || 1) + 1)
                          }))
                        }
                      >
                        Trang sau
                      </Button>
                    </div>
                  )}

                  {/* Suggestions Section */}
                  {results.suggestions && (
                    <div className="mt-12">
                      {results.suggestions.accessories && results.suggestions.accessories.length > 0 && (
                        <SuggestedProductsCarousel
                          title="Phụ kiện gợi ý"
                          products={results.suggestions.accessories}
                          onAddToCart={onAddToCart}
                          onProductClick={onProductClick}
                        />
                      )}
                      {results.suggestions.similarPrice && results.suggestions.similarPrice.length > 0 && (
                        <SuggestedProductsCarousel
                          title="Sản phẩm cùng tầm giá"
                          products={results.suggestions.similarPrice}
                          onAddToCart={onAddToCart}
                          onProductClick={onProductClick}
                        />
                      )}
                      {results.suggestions.hotDeals && results.suggestions.hotDeals.length > 0 && (
                        <SuggestedProductsCarousel
                          title="Hot & Khuyến mãi"
                          products={results.suggestions.hotDeals}
                          onAddToCart={onAddToCart}
                          onProductClick={onProductClick}
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <PackageSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm phù hợp</h3>
                  <p className="text-gray-600 mb-6">
                    Hãy thử từ khóa khác (ví dụ: "xiaomi 17 pro", "samsung s24 ultra") hoặc điều chỉnh bộ lọc
                  </p>
                  <Button variant="outline" onClick={goHome}>
                    Quay lại trang chủ
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
