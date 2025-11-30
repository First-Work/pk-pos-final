import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem } from '../types';
import { X, Trash2, ScanBarcode } from 'lucide-react';

interface VbaUserFormProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onRemoveFromCart: (index: number) => void;
  onCheckout: (method: string, customerName: string, amountPaid: number, notes: string) => void;
  cart: CartItem[];
  total: number;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const VbaUserForm: React.FC<VbaUserFormProps> = ({
  products,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  cart,
  total,
  isOpen,
  onClose,
  darkMode = false
}) => {
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [displayMessage, setDisplayMessage] = useState<string>('Ready');
  const [manualPrice, setManualPrice] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // New State for Customer & Payment
  const [customerName, setCustomerName] = useState<string>('');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Ref for the product dropdown to simulate VBA ComboBox
  const selectRef = useRef<HTMLSelectElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on open
  useEffect(() => {
    if (isOpen && barcodeRef.current) {
        barcodeRef.current.focus();
    }
  }, [isOpen]);

  // --- Formatting Helpers ---
  const parseNumber = (value: string): number => {
    if (!value) return 0;
    // Remove commas and parse
    const clean = value.replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Sync amount paid default when total changes
  useEffect(() => {
    // Only auto-fill if empty or currently 0
    if (total > 0) {
       const currentPaid = parseNumber(amountPaidInput);
       if (!amountPaidInput || currentPaid === 0) {
           setAmountPaidInput(formatNumber(total));
       }
    }
  }, [total]);

  // Sync manual price when product is selected
  useEffect(() => {
    const product = products.find(p => p.sku === selectedSku);
    if (product) {
      setManualPrice(formatNumber(product.price));
    } else {
      setManualPrice('');
    }
  }, [selectedSku, products]);

  // Automatic Discount Rule: 5% off if Quantity >= 3
  useEffect(() => {
    if (quantity >= 3) {
        setDiscountPercent(5);
    } else {
        setDiscountPercent(0);
    }
  }, [quantity]);

  if (!isOpen) return null;

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const code = barcodeInput.trim();
        if (!code) return;

        // Find product by SKU (case insensitive)
        const product = products.find(p => p.sku.toLowerCase() === code.toLowerCase());

        if (product) {
            // Check stock
            if (product.stock < quantity) {
                setDisplayMessage(`Error: Insufficient stock for ${product.name}`);
                return;
            }

            // Calculate Price (Default price with current quantity discount)
            const finalPrice = product.price * (1 - (discountPercent / 100));

            // Add to Cart
            onAddToCart({ ...product, price: finalPrice }, quantity);
            
            // Success Feedback
            setDisplayMessage(`Scanned & Added: ${product.name}`);
            setBarcodeInput(''); // Clear for next scan
            
            // Optional: Reset quantity to 1 after scan
            // setQuantity(1); 
        } else {
            setDisplayMessage(`Error: Product not found (SKU: ${code})`);
            setBarcodeInput('');
        }
    }
  };

  const handleAdd = () => {
    const product = products.find(p => p.sku === selectedSku);
    if (product) {
      if (product.stock < quantity) {
        setDisplayMessage(`Error: Insufficient stock for ${product.name}`);
        return;
      }
      
      const priceVal = parseNumber(manualPrice);
      if (priceVal < 0) {
         setDisplayMessage("Error: Invalid Price");
         return;
      }

      // Apply Discount
      const finalPrice = priceVal * (1 - (discountPercent / 100));

      // Add with final discounted price
      onAddToCart({ ...product, price: finalPrice }, quantity);
      
      setDisplayMessage(`Added ${quantity} x ${product.name}`);
      setQuantity(1);
    } else {
      setDisplayMessage("Error: Please select a product.");
    }
  };

  const handleCheckoutClick = (method: 'Cash' | 'Card') => {
    if (cart.length === 0) {
      setDisplayMessage("Error: Cart is empty.");
      return;
    }

    const finalCustomerName = customerName.trim() || "Walk-in Customer";
    const paid = parseNumber(amountPaidInput);
    
    // Determine Payment Status String
    let finalMethod = method as string;
    if (paid === 0) {
      finalMethod = 'Credit';
    } else if (paid < total) {
      finalMethod = `${method} (Partial)`;
    }

    onCheckout(finalMethod, finalCustomerName, paid, notes.trim());
    
    // Reset
    setDisplayMessage(`Transaction Complete (${finalMethod})`);
    setSelectedSku('');
    setQuantity(1);
    setCustomerName('');
    setAmountPaidInput('');
    setManualPrice('');
    setDiscountPercent(0);
    setNotes('');
  };

  const selectedProduct = products.find(p => p.sku === selectedSku);
  const isLowStock = selectedProduct && selectedProduct.stock < 5;
  
  // Calculations for balance
  const paidVal = parseNumber(amountPaidInput);
  const balance = total - paidVal;
  const isDue = balance > 0.5; // threshold for float
  
  // Calculation for Item Entry Preview
  const previewPrice = parseNumber(manualPrice);
  const previewTotal = (previewPrice * (1 - discountPercent/100)) * quantity;

  // Conditional Classes
  const windowClass = darkMode ? 'bg-[#333] border-gray-600' : 'bg-[#f0f0f0] vba-window';
  const inputClass = darkMode 
    ? 'w-full px-1 py-0.5 outline-none focus:bg-blue-900 bg-[#1a1a1a] text-white border border-gray-600'
    : 'w-full vba-inset px-1 py-0.5 outline-none focus:bg-blue-100 bg-white';
  const labelClass = darkMode ? 'text-gray-300' : 'text-black';
  const buttonClass = darkMode 
    ? 'bg-[#444] text-gray-200 border border-gray-500 hover:bg-[#555] active:bg-[#333]'
    : 'vba-button active:translate-y-px';
  const legendClass = darkMode ? 'bg-[#333] text-blue-300' : 'bg-[#f0f0f0] text-blue-800';

  return (
    <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 w-[600px] z-50 font-sans text-sm select-none ${windowClass}`}>
      {/* Title Bar */}
      <div className={`px-2 py-1 flex justify-between items-center select-none ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-[#000080] to-[#1084d0]'}`}>
        <span className="font-bold text-white">UserForm1 - Point of Sale (PKR)</span>
        <div className="flex gap-1">
          <button className={`w-4 h-4 flex items-center justify-center border text-[10px] leading-none pb-1 ${darkMode ? 'bg-[#444] text-white border-gray-600' : 'bg-[#f0f0f0] text-black border-gray-400'}`}>_</button>
          <button onClick={onClose} className={`w-4 h-4 flex items-center justify-center border text-[10px] leading-none pb-1 ${darkMode ? 'bg-[#444] text-white border-gray-600' : 'bg-[#f0f0f0] text-black border-gray-400'}`}>
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 grid grid-cols-12 gap-4">
        
        {/* Frame 1: Product Entry */}
        <fieldset className={`col-span-7 border p-2 relative mt-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          <legend className={`absolute -top-2 left-2 px-1 text-xs ${legendClass}`}>Item Entry</legend>
          
          <div className="grid grid-cols-4 gap-2 mt-2 items-center">
            
            {/* Barcode Scanner Input */}
            <label className={`col-span-1 text-right flex items-center justify-end gap-1 ${labelClass}`}>
                <ScanBarcode size={12}/> Scan:
            </label>
            <div className="col-span-3">
              <input 
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeSubmit}
                placeholder="Scan Barcode / Enter SKU..."
                className={`${inputClass} font-mono placeholder:italic`}
                autoFocus
              />
            </div>

            <div className={`col-span-4 border-b my-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

            <label className={`col-span-1 text-right ${labelClass}`}>Product:</label>
            <div className="col-span-3">
              <select 
                ref={selectRef}
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Item (Manual)...</option>
                {products.map(p => (
                  <option key={p.id} value={p.sku}>
                    {p.sku} - {p.name} (Rs. {p.price.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            <label className={`col-span-1 text-right ${labelClass}`}>Price:</label>
            <div className="col-span-3">
              <input 
                type="text"
                inputMode="decimal"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                onBlur={() => setManualPrice(formatNumber(parseNumber(manualPrice)))}
                onFocus={() => setManualPrice(parseNumber(manualPrice).toString())}
                className={`${inputClass} text-right`}
                placeholder="0.00"
              />
            </div>

            <label className={`col-span-1 text-right ${isLowStock ? 'text-red-500 font-bold' : labelClass}`}>Stock:</label>
            <div className="col-span-3 relative">
               <input 
                type="text" 
                value={selectedProduct ? selectedProduct.stock : ''} 
                disabled 
                title={isLowStock ? "Warning: Stock level is below 5 units" : "Current Inventory Level"}
                className={`w-full px-1 py-0.5 transition-colors duration-200 ${
                  isLowStock 
                    ? 'bg-red-100 text-red-600 font-bold border-red-500' 
                    : (darkMode ? 'bg-[#1a1a1a] text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-500 vba-inset')
                }`}
              />
              {isLowStock && (
                <div className="absolute right-1 top-0 h-full flex items-center pointer-events-none">
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1 animate-pulse border border-red-200 shadow-sm flex items-center gap-1">
                    ⚠ Low Stock
                  </span>
                </div>
              )}
            </div>

            <label className={`col-span-1 text-right ${labelClass}`}>Qty / Disc%:</label>
            <div className="col-span-3 flex items-center gap-2">
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className={`w-12 ${inputClass}`}
                title="Quantity"
              />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>@</span>
              <input 
                type="number" 
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                className={`w-12 text-center ${inputClass} ${discountPercent > 0 ? (darkMode ? 'text-yellow-400 border-yellow-700' : 'text-red-600 bg-yellow-50 border-yellow-300') : ''}`}
                title="Discount Percent"
              />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
            </div>

             <div className="col-span-4 flex items-center justify-between border-t pt-2 mt-1">
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Line Total: <span className="font-mono font-bold">Rs. {formatNumber(previewTotal)}</span>
                </div>
                <button 
                    onClick={handleAdd}
                    className={`${buttonClass} px-4 py-0.5 font-bold`}
                >
                    Add to Cart
                </button>
             </div>
          </div>
        </fieldset>

        {/* Frame 2: Totals & Actions */}
        <fieldset className={`col-span-5 border p-2 relative mt-2 flex flex-col justify-start gap-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          <legend className={`absolute -top-2 left-2 px-1 text-xs ${legendClass}`}>Transaction Details</legend>
          
          <div className="mt-2">
             <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer / Vendor Name:</div>
             <input 
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className={`${inputClass} mb-2`}
             />
             
             <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount Paid (Rs.):</div>
             <input 
                type="text"
                inputMode="decimal"
                value={amountPaidInput}
                onChange={(e) => setAmountPaidInput(e.target.value)}
                onBlur={() => setAmountPaidInput(formatNumber(parseNumber(amountPaidInput)))}
                onFocus={() => setAmountPaidInput(parseNumber(amountPaidInput).toString())}
                className={`${inputClass} font-mono text-right mb-2`}
             />

            <div className={`text-xs mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes:</div>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClass} h-8 resize-none text-xs`}
                placeholder="Optional notes..."
            />
          </div>

          <div className="text-center mt-auto">
             <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bill</div>
             <div className={`font-mono text-xl py-1 px-1 text-right overflow-hidden ${darkMode ? 'bg-black text-green-400 border border-gray-600' : 'vba-inset bg-black text-[#00FF00]'}`}>
               Rs. {formatNumber(total)}
             </div>
             
             <div className={`flex justify-between text-xs mt-1 px-1 ${darkMode ? 'text-gray-300' : ''}`}>
                <span>{isDue ? 'Remaining:' : 'Change:'}</span>
                <span className={`font-bold ${isDue ? 'text-red-600' : 'text-green-700'}`}>
                    {formatNumber(Math.abs(balance))}
                </span>
             </div>
          </div>

          <div className="flex gap-1 mt-2">
            <button 
              onClick={() => handleCheckoutClick('Cash')}
              className={`${buttonClass} py-1.5 flex-1 font-bold text-xs`}
            >
              CASH
            </button>
            <button 
              onClick={() => handleCheckoutClick('Card')}
              className={`${buttonClass} py-1.5 flex-1 font-bold text-xs`}
            >
              CARD
            </button>
          </div>
        </fieldset>

        {/* ListBox equivalent */}
        <div className="col-span-12">
            <div className={`flex justify-between text-xs px-1 mb-0.5 ${darkMode ? 'text-gray-400' : ''}`}>
                <span>Description</span>
                <span className="mr-8">Qty</span>
                <span className="mr-2">Subtotal</span>
            </div>
            <div className={`h-32 overflow-y-scroll font-mono text-xs ${darkMode ? 'bg-[#1a1a1a] text-gray-300 border border-gray-600' : 'vba-inset bg-white'}`}>
                {cart.map((item, idx) => {
                    // Check for discount display
                    const originalProduct = products.find(p => p.id === item.id);
                    const isDiscounted = originalProduct && item.price < originalProduct.price;
                    const discountAmt = isDiscounted ? (1 - (item.price / originalProduct.price)) * 100 : 0;

                    return (
                        <div key={`${item.id}-${idx}`} className="flex justify-between items-center px-1 hover:bg-blue-600 hover:text-white group">
                            <span className="truncate w-1/2 flex items-center gap-1">
                              {item.name} 
                              {isDiscounted && (
                                 <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded-sm">-{Math.round(discountAmt)}%</span>
                              )}
                              {!isDiscounted && item.price !== originalProduct?.price && (
                                <span className="text-[10px] ml-1 opacity-70">(@ {formatNumber(item.price)})</span>
                              )}
                            </span>
                            <span className="w-1/12 text-center">{item.quantity}</span>
                            <span className="w-1/4 text-right">Rs. {formatNumber(item.price * item.quantity)}</span>
                            
                            {/* Remove Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Are you sure you want to remove this item from the cart?")) {
                                        onRemoveFromCart(idx);
                                    }
                                }}
                                className={`ml-2 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500 hover:text-white ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                                title="Remove Item"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    );
                })}
                {cart.length === 0 && <div className="text-gray-400 p-1 italic">Waiting for input...</div>}
            </div>
        </div>

        {/* Status Bar */}
        <div className={`col-span-12 px-2 py-1 text-xs ${darkMode ? 'bg-gray-800 border border-gray-600 text-blue-300' : 'vba-inset bg-gray-100 text-blue-900'}`}>
           Status: {displayMessage}
        </div>
      </div>
    </div>
  );
};