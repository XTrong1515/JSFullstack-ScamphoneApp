import { useState, useEffect } from "react";
import { Search, AlertTriangle, Package, Loader2, RefreshCw, Eye, EyeOff, Filter } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { productService, Product } from "../../services/productService";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  location: string;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  product: Product; // Keep reference to original product
}

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [variantFilter, setVariantFilter] = useState<string>('all'); // 'all', 'main', or specific variant
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts({
        limit: 100,
        page: 1
        // Load all products including hidden ones for admin view
      });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const expandAllProducts = () => {
    setExpandedProducts(new Set(filteredInventory.filter(item => 
      item.product.variants && item.product.variants.length > 0
    ).map(item => item.id)));
  };

  const collapseAllProducts = () => {
    setExpandedProducts(new Set());
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: string) => {
    try {
      setUpdatingProductId(productId);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await productService.updateProductStatus(productId, newStatus);
      
      // Update local state to reflect new status
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === productId ? { ...p, status: newStatus } : p
        )
      );
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Không thể cập nhật trạng thái sản phẩm');
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Convert Product to InventoryItem for display
  const inventory: InventoryItem[] = products.map(product => {
    // Generate SKU from product ID or use brand + name
    let sku = product._id.substring(product._id.length - 8).toUpperCase();
    if (product.brand) {
      const brandCode = product.brand.substring(0, 3).toUpperCase();
      const nameCode = product.name.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase();
      sku = `${brandCode}-${nameCode}`;
    }
    
    return {
      id: product._id,
      name: product.name,
      sku: sku,
      category: product.category?.name || 'N/A',
      stock: product.stock_quantity,
      minStock: 10, // Default minimum stock threshold
      price: product.price,
      location: `Kho ${product.category?.name?.charAt(0) || 'A'}`, // Generate location based on category
      lastUpdated: new Date(product.updatedAt).toISOString().split('T')[0],
      status: product.status || 'active',
      product: product // Keep reference
    };
  });

  const filteredInventory = inventory.filter(
    (item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  const lowStockItems = inventory.filter((item) => item.stock < item.minStock && item.status === 'active');
  const hiddenItems = inventory.filter((item) => item.status === 'inactive');
  const totalValue = inventory.reduce(
    (sum, item) => sum + item.stock * item.price,
    0
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Quản lý kho hàng</h2>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducts}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Đang tải...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Làm mới</span>
              </>
            )}
          </Button>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 px-3 py-1">
            {inventory.length} sản phẩm
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Tổng sản phẩm</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Sắp hết hàng</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gray-100 rounded-lg flex-shrink-0">
              <EyeOff className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Đã ẩn</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{hiddenItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-green-100 rounded-lg flex-shrink-0">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Giá trị kho</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">₫{(totalValue / 1000000).toFixed(0)}M</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 md:p-6 border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-yellow-900 text-sm md:text-base">Cảnh báo tồn kho thấp</h3>
              <p className="text-xs md:text-sm text-yellow-700 mt-1">
                {lowStockItems.length} sản phẩm đang dưới mức tồn kho tối thiểu. 
                Bạn có thể ẩn các sản phẩm này khỏi trang chủ để tránh đơn hàng không thể xử lý.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <Badge key={item.id} variant="outline" className="bg-white text-xs">
                    {item.name} ({item.stock}/{item.minStock})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 text-sm md:text-base"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 font-medium">Trạng thái:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="flex-1 sm:flex-none text-xs md:text-sm"
                >
                  Tất cả ({inventory.length})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                  className="flex-1 sm:flex-none text-xs md:text-sm"
                >
                  <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Hiển thị ({inventory.filter(i => i.status === 'active').length})
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                  className="flex-1 sm:flex-none text-xs md:text-sm"
                >
                  <EyeOff className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Đã ẩn ({hiddenItems.length})
                </Button>
              </div>
            </div>

            {/* Variant Expand/Collapse Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 font-medium">
                <Filter className="w-4 h-4 inline mr-1" />
                Biến thể:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={expandAllProducts}
                className="text-xs md:text-sm"
              >
                Mở tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAllProducts}
                className="text-xs md:text-sm"
              >
                Đóng tất cả
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Inventory Table - Desktop */}
      <Card className="hidden lg:block p-4 md:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-3 font-semibold text-gray-700 w-10"></th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">SKU</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Tên sản phẩm</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Danh mục</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Biến thể</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Tồn kho</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Giá trị</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Cập nhật</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const isLowStock = item.stock < item.minStock;
                const isUpdating = updatingProductId === item.id;
                const hasVariants = item.product.variants && item.product.variants.length > 0;
                const isExpanded = expandedProducts.has(item.id);
                
                return (
                  <>
                    {/* Main Product Row */}
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        {hasVariants && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleProductExpansion(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 15-6-6-6 6"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            )}
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">{item.sku}</td>
                      <td className="py-3 px-3 font-medium">{item.name}</td>
                      <td className="py-3 px-3">{item.category}</td>
                      <td className="py-3 px-3">
                        {hasVariants ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs cursor-pointer" onClick={() => toggleProductExpansion(item.id)}>
                            {item.product.variants.length} biến thể
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">Không có</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isLowStock ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {item.stock}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Min: {item.minStock}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge 
                          variant={item.status === 'active' ? 'default' : 'secondary'}
                          className={
                            item.status === 'active' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        >
                          {item.status === 'active' ? 'Hiển thị' : 'Đã ẩn'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-900">
                        ₫{((item.stock * item.price) / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500">
                        {item.lastUpdated}
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleProductStatus(item.id, item.status)}
                          disabled={isUpdating}
                          className={`transition-all ${
                            isLowStock && item.status === 'active'
                              ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                              : item.status === 'inactive'
                              ? 'border-green-500 text-green-700 hover:bg-green-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : item.status === 'active' ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              <span className="text-xs">Ẩn</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              <span className="text-xs">Hiện</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Variant Rows */}
                    {isExpanded && hasVariants && item.product.variants.map((variant, vIndex) => {
                      const variantAttrs = variant.attributes instanceof Map 
                        ? Object.fromEntries(variant.attributes)
                        : variant.attributes;
                      const variantLabel = variantAttrs 
                        ? Object.values(variantAttrs).join(' - ') 
                        : `Variant ${vIndex + 1}`;
                      const variantLowStock = variant.stock < 10;

                      return (
                        <tr key={`${item.id}-variant-${vIndex}`} className="border-b bg-blue-50/30 hover:bg-blue-100/50 transition-colors">
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3 pl-8 font-mono text-xs text-gray-600">{variant.sku || '-'}</td>
                          <td className="py-2 px-3 text-sm text-gray-700 pl-8">
                            <span className="text-xs text-gray-500">↳ </span>
                            {variantLabel}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-500">-</td>
                          <td className="py-2 px-3">
                            <div className="flex flex-col gap-1">
                              {variantAttrs && Object.entries(variantAttrs).map(([key, value]) => (
                                <Badge key={`${item.id}-${vIndex}-${key}`} variant="outline" className="text-xs bg-white">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${variantLowStock ? "text-red-600" : "text-green-600"}`}>
                                {variant.stock}
                              </span>
                              {variantLowStock && <AlertTriangle className="w-3 h-3 text-yellow-600" />}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">
                              Variant
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700">
                            ₫{((variant.stock * variant.price) / 1000000).toFixed(1)}M
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-500">-</td>
                          <td className="py-2 px-3 text-xs text-gray-400">-</td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inventory Cards - Mobile & Tablet */}
      <div className="lg:hidden space-y-3">
        {filteredInventory.map((item) => {
          const isLowStock = item.stock < item.minStock;
          const isUpdating = updatingProductId === item.id;
          
          return (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{item.sku}</p>
                  </div>
                  <Badge 
                    variant={item.status === 'active' ? 'default' : 'secondary'}
                    className={`flex-shrink-0 ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {item.status === 'active' ? 'Hiển thị' : 'Đã ẩn'}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Danh mục</p>
                    <p className="font-medium text-gray-900">{item.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Tồn kho</p>
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold ${isLowStock ? "text-red-600" : "text-green-600"}`}>
                        {item.stock}
                      </span>
                      {isLowStock && <AlertTriangle className="w-3 h-3 text-yellow-600" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Giá trị</p>
                    <p className="font-semibold text-gray-900">
                      ₫{((item.stock * item.price) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Cập nhật</p>
                    <p className="text-gray-700">{item.lastUpdated}</p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleProductStatus(item.id, item.status)}
                  disabled={isUpdating}
                  className={`w-full transition-all ${
                    isLowStock && item.status === 'active'
                      ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                      : item.status === 'inactive'
                      ? 'border-green-500 text-green-700 hover:bg-green-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : item.status === 'active' ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ẩn sản phẩm
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Hiện sản phẩm
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
