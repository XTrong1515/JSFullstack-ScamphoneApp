import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { adminService } from "../../services/adminService";

interface ProductFormProps {
  product?: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    stock_quantity: number;
    category: { _id: string; name: string } | string;
    brand?: string;
    images?: string[];
    image?: string;
    specifications?: Record<string, string>;
    discount?: number;
    isHot?: boolean;
    attributes?: Array<{ name: string; values: string[] }>;
    variants?: Array<{
      attributes: Record<string, string>;
      price: number;
      originalPrice?: number;
      stock: number;
      sku?: string;
      image?: string;
    }>;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ _id: string; name: string }>;
}

export function ProductForm({ product, onClose, onSuccess, categories }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  
  // ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  
  // Initialize form data with product data if editing
  const getInitialFormData = () => {
    if (product) {
      const categoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category._id;
      
      const specsArray = product.specifications
        ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
        : [{ key: "", value: "" }];
      
      const images = product.images && product.images.length > 0 
        ? product.images 
        : product.image 
        ? [product.image] 
        : [""];
      
      const attributesArray = product.attributes || [];
      const variantsArray = product.variants || [];
      
      return {
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        category: categoryId,
        brand: product.brand || "",
        images,
        specifications: specsArray,
        discount: product.discount?.toString() || "",
        isHot: product.isHot || false,
        attributes: attributesArray,
        variants: variantsArray,
      };
    }
    
    return {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      stock_quantity: "",
      category: "",
      brand: "",
      images: [""],
      specifications: [{ key: "", value: "" }],
      discount: "",
      isHot: false,
      attributes: [],
      variants: [],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [newAttributeValues, setNewAttributeValues] = useState<{ [key: number]: string }>({});
  const [imageInputMode, setImageInputMode] = useState<{ [key: number]: 'url' | 'file' }>({});

  const handleAddImage = () => {
    setFormData({ ...formData, images: [...formData.images, ""] });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length > 0 ? newImages : [""] });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const handleImageFileChange = async (index: number, file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      // Convert to base64 or upload to server
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newImages = [...formData.images];
        newImages[index] = base64;
        setFormData({ ...formData, images: newImages });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi tải ảnh lên!');
    }
  };

  const handleAddSpecification = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: "", value: "" }],
    });
  };

  const handleRemoveSpecification = (index: number) => {
    const newSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      specifications: newSpecs.length > 0 ? newSpecs : [{ key: "", value: "" }],
    });
  };

  const handleSpecificationChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  // Attributes handlers
  const handleAddAttribute = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { name: "", values: [] }],
    });
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttrs = formData.attributes.filter((_, i) => i !== index);
    setFormData({ ...formData, attributes: newAttrs });
    // Regenerate variants when attributes change
    if (newAttrs.length > 0) {
      generateVariants(newAttrs);
    } else {
      setFormData(prev => ({ ...prev, variants: [] }));
    }
  };

  const handleAttributeNameChange = (index: number, name: string) => {
    const newAttrs = [...formData.attributes];
    newAttrs[index].name = name;
    setFormData({ ...formData, attributes: newAttrs });
  };

  const handleAddAttributeValue = (attrIndex: number) => {
    const newValue = newAttributeValues[attrIndex]?.trim();
    if (!newValue) return;

    const newAttrs = [...formData.attributes];
    if (!newAttrs[attrIndex].values.includes(newValue)) {
      newAttrs[attrIndex].values = [...newAttrs[attrIndex].values, newValue];
      setFormData({ ...formData, attributes: newAttrs });
    }
    
    // Reset input
    setNewAttributeValues({ ...newAttributeValues, [attrIndex]: '' });
  };

  const handleRemoveAttributeValue = (attrIndex: number, valueIndex: number) => {
    const newAttrs = [...formData.attributes];
    newAttrs[attrIndex].values = newAttrs[attrIndex].values.filter((_, i) => i !== valueIndex);
    setFormData({ ...formData, attributes: newAttrs });
  };

  const handleAttributeValueKeyPress = (attrIndex: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttributeValue(attrIndex);
    }
  };

  // Generate variants from attributes
  const generateVariants = (attrs = formData.attributes) => {
    if (attrs.length === 0 || attrs.some(attr => !attr.name || attr.values.length === 0)) {
      return;
    }

    // Generate all combinations
    const generateCombinations = (arrays: string[][]): string[][] => {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restCombinations = generateCombinations(rest);
      return first.flatMap(value =>
        restCombinations.map(combo => [value, ...combo])
      );
    };

    const attrNames = attrs.map(attr => attr.name);
    const attrValues = attrs.map(attr => attr.values);
    const combinations = generateCombinations(attrValues);

    const newVariants = combinations.map(combo => {
      const attributes: Record<string, string> = {};
      attrNames.forEach((name, idx) => {
        attributes[name] = combo[idx];
      });

      // Check if variant already exists (preserve user data)
      const existing = formData.variants.find(v => 
        JSON.stringify(v.attributes) === JSON.stringify(attributes)
      );

      return existing || {
        attributes,
        price: parseFloat(formData.price) || 0,
        originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price) || 0,
        stock: 0,
        sku: '',
        image: ''
      };
    });

    setFormData({ ...formData, variants: newVariants });
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.price || !formData.category || !formData.stock_quantity) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      setLoading(true);

      // Convert specifications array to object
      const specifications: Record<string, string> = {};
      formData.specifications.forEach((spec) => {
        if (spec.key && spec.value) {
          specifications[spec.key] = spec.value;
        }
      });

      // Calculate total stock from variants if exists
      let totalStock = parseInt(formData.stock_quantity);
      if (formData.variants.length > 0) {
        totalStock = formData.variants.reduce((sum, v) => sum + parseInt(v.stock.toString() || '0'), 0);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : parseFloat(formData.price),
        stock_quantity: totalStock,
        category: formData.category,
        brand: formData.brand,
        images: formData.images.filter((img) => img.trim() !== ""),
        image: formData.images[0] || "",
        specifications,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        isHot: formData.isHot,
        attributes: formData.attributes.filter(attr => attr.name && attr.values.length > 0),
        variants: formData.variants.map(v => ({
          ...v,
          price: parseFloat(v.price.toString()),
          originalPrice: v.originalPrice ? parseFloat(v.originalPrice.toString()) : parseFloat(v.price.toString()),
          stock: parseInt(v.stock.toString())
        })),
      };

      if (product) {
        // Update existing product
        await adminService.updateProduct(product._id, productData);
        alert("Cập nhật sản phẩm thành công!");
      } else {
        // Create new product
        await adminService.createProduct(productData);
        alert("Thêm sản phẩm thành công!");
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(error?.response?.data?.message || `Có lỗi xảy ra khi ${product ? 'cập nhật' : 'thêm'} sản phẩm!`);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

                {/* Form Content */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">{/* Basic Information Section */}
            {/* Basic Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-lg">📝</span>
                <h3 className="font-bold text-base text-gray-900">Thông tin cơ bản</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: iPhone 15 Pro Max 256GB"
                    className="h-10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2.5 min-h-[80px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giá bán <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="29990000"
                        className="h-10 pl-8"
                        required
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₫</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giá gốc
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        placeholder="34990000"
                        className="h-10 pl-8"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₫</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Số lượng <span className="text-red-500">*</span>
                      {formData.variants.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">(Tự động tính)</span>
                      )}
                    </label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="100"
                      className="h-10"
                      required
                      disabled={formData.variants.length > 0}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Thương hiệu
                    </label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="VD: Apple"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giảm giá (%)
                    </label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="VD: 15"
                      className="h-10"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer h-10">
                      <input
                        type="checkbox"
                        checked={formData.isHot}
                        onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Sản phẩm HOT 🔥</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  <h3 className="font-bold text-base text-gray-900">Hình ảnh</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImage}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Thêm
                </Button>
              </div>

              <div className="space-y-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    {/* Mode selector */}
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant={imageInputMode[index] !== 'file' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageInputMode({ ...imageInputMode, [index]: 'url' })}
                        className="flex-1 h-8 text-xs"
                      >
                        🔗 Link URL
                      </Button>
                      <Button
                        type="button"
                        variant={imageInputMode[index] === 'file' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageInputMode({ ...imageInputMode, [index]: 'file' })}
                        className="flex-1 h-8 text-xs"
                      >
                        📁 Tải lên
                      </Button>
                    </div>

                    {/* Input based on mode */}
                    <div className="flex gap-2">
                      {imageInputMode[index] === 'file' ? (
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(index, e.target.files?.[0] || null)}
                            className="w-full text-sm border border-gray-300 rounded-lg p-2 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {image && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {image.startsWith('data:') ? 'Ảnh đã tải lên' : image}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Input
                          value={image}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          placeholder={`Link ảnh ${index + 1}`}
                          className="flex-1 h-9 text-sm"
                        />
                      )}
                      {formData.images.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                          className="h-9 w-9 p-0 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Image preview */}
                    {image && (
                      <div className="mt-2">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="h-20 w-20 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Error';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h3 className="font-bold text-base text-gray-900">Thông số kỹ thuật</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSpecification}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Thêm
                </Button>
              </div>

              <div className="space-y-2">
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      className="flex-1 h-9 text-sm"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, "key", e.target.value)}
                      placeholder="VD: Màn hình"
                    />
                    <Input
                      className="flex-1 h-9 text-sm"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                      placeholder="VD: 6.7 inch"
                    />
                    {formData.specifications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSpecification(index)}
                        className="h-9 w-9 p-0 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Product Attributes (for Variants) */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏷️</span>
                  <h3 className="font-bold text-base text-gray-900">Thuộc tính (Variants)</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttribute}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Thêm
                </Button>
              </div>

              <div className="space-y-3">
                {formData.attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 p-3 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={attr.name}
                        onChange={(e) => handleAttributeNameChange(index, e.target.value)}
                        placeholder="VD: Màu sắc, Dung lượng"
                        className="flex-1 h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAttribute(index)}
                        className="h-9 w-9 p-0 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    {/* Display existing values as badges */}
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((val, vIdx) => (
                        <Badge
                          key={vIdx}
                          variant="secondary"
                          className="pl-2.5 pr-1 py-1 text-xs font-medium flex items-center gap-1"
                        >
                          {val}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttributeValue(index, vIdx)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {/* Input to add new value */}
                    <div className="flex gap-2">
                      <Input
                        value={newAttributeValues[index] || ''}
                        onChange={(e) => setNewAttributeValues({ ...newAttributeValues, [index]: e.target.value })}
                        onKeyPress={(e) => handleAttributeValueKeyPress(index, e)}
                        placeholder="Thêm giá trị (nhấn Enter)..."
                        className="flex-1 h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAttributeValue(index)}
                        className="h-9 px-3"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Thêm
                      </Button>
                    </div>
                  </div>
                ))}

                {formData.attributes.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-sm border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => generateVariants()}
                  >
                    🔄 Tạo Variants
                  </Button>
                )}
              </div>
            </div>

          {/* Variants Table - Desktop */}
          {formData.variants.length > 0 && (
            <>
              <div className="hidden lg:block space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">
                  Quản lý Variants ({formData.variants.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Thuộc tính</th>
                        <th className="text-left p-2">Giá bán</th>
                        <th className="text-left p-2">Giá gốc</th>
                        <th className="text-left p-2">Số lượng</th>
                        <th className="text-left p-2">SKU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((variant, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(variant.attributes).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                                >
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                              className="w-32"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={variant.originalPrice || variant.price}
                              onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                              className="w-32"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={variant.sku || ''}
                              onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                              placeholder="SKU-001"
                              className="w-32"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Variants Cards - Mobile */}
              <div className="lg:hidden space-y-3 border-t pt-4">
                <h3 className="font-semibold text-base">
                  Quản lý Variants ({formData.variants.length})
                </h3>
                {formData.variants.map((variant, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                        >
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Giá bán</label>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Giá gốc</label>
                        <Input
                          type="number"
                          value={variant.originalPrice || variant.price}
                          onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">Số lượng</label>
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">SKU</label>
                          <Input
                            value={variant.sku || ''}
                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                            placeholder="SKU-001"
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          </div>
        </form>

        {/* Compact Footer */}
        <div className="border-t bg-white px-6 py-4 flex gap-3 justify-end flex-shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="h-10 px-6"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="product-form"
            className="bg-blue-600 hover:bg-blue-700 h-10 px-6 font-medium"
            disabled={loading}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              const form = document.getElementById('product-form') as HTMLFormElement;
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {product ? "Đang lưu..." : "Đang thêm..."}
              </>
            ) : (
              <>
                {product ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
