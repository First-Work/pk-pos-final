
import React, { useState } from 'react';
import { Product } from '../types';
import { X } from 'lucide-react';

interface AddProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  existingProducts: Product[];
  darkMode?: boolean;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ isOpen, onClose, onSave, existingProducts, darkMode = false }) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Formatting Helpers
  const parseNumber = (value: string): number => {
    if (!value) return 0;
    const clean = value.replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val: string): string => {
    const num = parseNumber(val);
    if (num === 0 && val === '') return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatInteger = (val: string): string => {
    const num = parseNumber(val);
    if (num === 0 && val === '') return '';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const handleSubmit = () => {
    setError('');

    if (!sku.trim()) {
      setError('SKU is required.');
      return;
    }

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }

    if (!category) {
      setError('Category is required.');
      return;
    }

    const numPrice = parseNumber(price);
    if (!price || numPrice < 0) {
      setError('Price is required and must be a valid positive number.');
      return;
    }

    const numStock = parseNumber(stock);
    if (!stock || numStock < 0) {
      setError('Initial Stock is required and must be a valid non-negative number.');
      return;
    }

    // Check for duplicate SKU
    const skuExists = existingProducts.some(p => p.sku.toLowerCase() === sku.trim().toLowerCase());
    if (skuExists) {
      setError('Error: SKU already exists.');
      return;
    }

    onSave({
      sku: sku.trim(),
      name: name.trim(),
      price: numPrice,
      category,
      stock: numStock,
      imageUrl: imageUrl.trim() || undefined
    });

    // Reset form
    setSku('');
    setName('');
    setPrice('');
    setCategory('');
    setStock('');
    setImageUrl('');
    setError('');
    onClose();
  };

  // Styles
  const windowClass = darkMode ? 'bg-[#333] border-gray-600' : 'bg-[#f0f0f0] vba-window';
  const inputClass = darkMode 
    ? 'w-full px-1 py-0.5 outline-none focus:bg-blue-900 bg-[#1a1a1a] text-white border border-gray-600'
    : 'w-full vba-inset px-1 py-0.5 outline-none focus:bg-yellow-50';
  const labelClass = darkMode ? 'text-gray-300' : 'text-black';
  const buttonClass = darkMode 
    ? 'bg-[#444] text-gray-200 border border-gray-500 hover:bg-[#555] active:bg-[#333]'
    : 'vba-button active:translate-y-px';
  const legendClass = darkMode ? 'bg-[#333] text-blue-300' : 'bg-[#f0f0f0] text-blue-800';

  return (
    <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 w-[450px] z-50 font-sans text-sm select-none ${windowClass}`}>
      {/* Title Bar */}
      <div className={`px-2 py-1 flex justify-between items-center select-none ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-[#000080] to-[#1084d0]'}`}>
        <span className="font-bold text-white">UserForm2 - Add New Product</span>
        <div className="flex gap-1">
            <button className={`w-4 h-4 flex items-center justify-center border text-[10px] leading-none pb-1 ${darkMode ? 'bg-[#444] text-white border-gray-600' : 'bg-[#f0f0f0] text-black border-gray-400'}`}>?</button>
            <button onClick={onClose} className={`w-4 h-4 flex items-center justify-center border text-[10px] leading-none pb-1 ${darkMode ? 'bg-[#444] text-white border-gray-600' : 'bg-[#f0f0f0] text-black border-gray-400'}`}>
                <X size={10} />
            </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4">
        
        <fieldset className={`border p-3 relative mt-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          <legend className={`absolute -top-2 left-2 px-1 text-xs ${legendClass}`}>Product Details</legend>
          
          <div className="grid grid-cols-12 gap-y-3 gap-x-2 mt-2 items-center">
            
            <label className={`col-span-3 text-right text-xs ${labelClass}`}>SKU Code:</label>
            <div className="col-span-9">
              <input 
                type="text" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={inputClass}
                placeholder="e.g. ITEM-001"
              />
            </div>

            <label className={`col-span-3 text-right text-xs ${labelClass}`}>Product Name:</label>
            <div className="col-span-9">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Item Name"
              />
            </div>

            <label className={`col-span-3 text-right text-xs ${labelClass}`}>Category:</label>
            <div className="col-span-9">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Category...</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Garments">Garments</option>
                <option value="Accessories">Accessories</option>
                <option value="General">General</option>
              </select>
            </div>

            <label className={`col-span-3 text-right text-xs ${labelClass}`}>Price (Rs.):</label>
            <div className="col-span-3">
              <input 
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => setPrice(formatCurrency(price))}
                onFocus={() => setPrice(parseNumber(price).toString())}
                className={`${inputClass} text-right`}
                placeholder="0.00"
              />
            </div>

            <label className={`col-span-3 text-right text-xs ${labelClass}`}>Initial Stock:</label>
            <div className="col-span-3">
              <input 
                type="text"
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onBlur={() => setStock(formatInteger(stock))}
                onFocus={() => setStock(parseNumber(stock).toString())}
                className={`${inputClass} text-right`}
                placeholder="0"
              />
            </div>

            <label className={`col-span-3 text-right text-xs ${labelClass}`}>Image URL:</label>
            <div className="col-span-9">
              <input 
                type="text" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
                placeholder="https://example.com/image.jpg (Optional)"
              />
            </div>

          </div>
        </fieldset>

        <div className="flex justify-between items-center mt-6">
             <div className="text-red-600 text-[10px] h-4 font-semibold">{error}</div>
             <div className="flex gap-2">
                <button 
                  onClick={onClose}
                  className={`${buttonClass} px-4 py-1 min-w-[80px]`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className={`${buttonClass} px-4 py-1 min-w-[80px] font-bold`}
                >
                  Save Product
                </button>
             </div>
        </div>

      </div>
    </div>
  );
};
