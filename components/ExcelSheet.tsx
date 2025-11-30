import React, { useState } from 'react';
import { Product, SaleRecord, SheetView, CartItem } from '../types';
import { Search, Image as ImageIcon, ChevronRight, ChevronDown, Filter, Printer, ArrowLeft, FileText, User, TrendingUp, ShoppingBag, Trash2, Ban, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ExcelSheetProps {
  view: SheetView;
  products: Product[];
  sales: SaleRecord[];
  darkMode?: boolean;
  onDeleteProduct?: (id: string) => void;
  onVoidSale?: (id: string) => void;
  onReturnItem?: (saleId: string, item: CartItem, returnQty: number, reason: string) => void;
}

export const ExcelSheet: React.FC<ExcelSheetProps> = ({ view, products, sales, darkMode = false, onDeleteProduct, onVoidSale, onReturnItem }) => {
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedCustomerLedger, setSelectedCustomerLedger] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{ type: 'RECEIPT' | 'STATEMENT', data: any } | null>(null);
  
  // Helper to generate column headers A, B, C...
  const getColHeader = (n: number) => String.fromCharCode(65 + n);
  
  // Dashboard Analytics
  const getDashboardStats = () => {
    if (sales.length === 0) return { mostSold: null, topRevenue: null };

    const itemStats = new Map<string, { name: string, qty: number, revenue: number }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!itemStats.has(item.id)) {
          itemStats.set(item.id, { name: item.name, qty: 0, revenue: 0 });
        }
        const stat = itemStats.get(item.id)!;
        stat.qty += item.quantity;
        stat.revenue += (item.price * item.quantity);
      });
    });

    const sortedByQty = Array.from(itemStats.values()).sort((a, b) => b.qty - a.qty);
    const sortedByRev = Array.from(itemStats.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      mostSold: sortedByQty[0], // Highest Quantity
      topRevenue: sortedByRev[0] // Highest Revenue (Most Purchased/Value)
    };
  };

  const { mostSold, topRevenue } = getDashboardStats();

  // Print Logic
  const handlePrint = (type: 'RECEIPT' | 'STATEMENT', data: any) => {
    setPrintData({ type, data });
  };

  const renderPrintPreview = () => {
    if (!printData) return null;

    const { type, data } = printData;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center print:bg-white print:inset-0 print:block print:relative print-only-container">
            <div className="bg-white p-8 w-[210mm] min-h-[297mm] relative overflow-y-auto print:p-0 print:w-full print:h-full print:shadow-none shadow-2xl">
                 {/* Floating Header for Preview */}
                 <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Print / Save PDF</button>
                    <button onClick={() => setPrintData(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">Close</button>
                 </div>

                 {type === 'RECEIPT' && <PrintReceiptTemplate sale={data} />}
                 {type === 'STATEMENT' && <PrintStatementTemplate customerName={data.customerName} sales={data.sales} />}
            </div>
        </div>
    );
  };

  const renderInventory = () => {
    // Get unique categories for filter
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()];

    // Filter products based on search term and category
    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                            p.sku.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesCategory = inventoryCategoryFilter === 'All' || p.category === inventoryCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    return (
      <>
        {/* Search Toolbar */}
        <div className={`sticky top-0 z-20 border-b p-2 flex items-center gap-2 h-10 box-border print:hidden ${darkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-[#f8f9fa] border-gray-300'}`}>
          <div className="relative w-64">
             <Search size={14} className="absolute left-2 top-1.5 text-gray-400"/>
             <input 
                 type="text" 
                 placeholder="Filter by Name or SKU..." 
                 className={`w-full pl-8 pr-2 py-1 text-xs border rounded focus:border-[#107C41] focus:outline-none ${darkMode ? 'bg-[#2d2d2d] border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                 value={inventorySearch}
                 onChange={(e) => setInventorySearch(e.target.value)}
             />
          </div>

          <div className="relative">
             <Filter size={14} className="absolute left-2 top-1.5 text-gray-400 pointer-events-none"/>
             <select 
                value={inventoryCategoryFilter}
                onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                className={`pl-8 pr-8 py-1 text-xs border rounded focus:border-[#107C41] focus:outline-none appearance-none cursor-pointer h-[26px] min-w-[120px] ${darkMode ? 'bg-[#2d2d2d] border-gray-600 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
             >
                {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
             </select>
             <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none"/>
          </div>

          <span className={`text-[10px] ml-2 border-l pl-2 ${darkMode ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-gray-300'}`}>{filteredProducts.length} items found</span>
        </div>

        {/* Header Row - Adjusted top position to account for search bar */}
        <div className={`flex border-b font-semibold text-center text-xs sticky top-10 z-10 print:static ${darkMode ? 'bg-[#2d2d2d] border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
          <div className={`w-10 border-r ${darkMode ? 'border-gray-700 bg-[#2d2d2d]' : 'border-gray-300 bg-gray-100'}`}></div> {/* Row Number Col */}
          {/* Columns: ID, Img, SKU, Name... */}
          <div className={`w-24 border-r py-1 flex justify-center items-center ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>{getColHeader(0)}</div>
          <div className={`w-16 border-r py-1 flex justify-center items-center ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>{getColHeader(1)}</div>
          {['SKU', 'Name', 'Category', 'Price (PKR)', 'Stock'].map((h, i) => (
            <div key={h} className={`w-40 border-r py-1 flex justify-center items-center ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
               {getColHeader(i + 2)}
            </div>
          ))}
          {/* Action Column */}
          <div className={`w-12 border-r py-1 flex justify-center items-center ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>{getColHeader(7)}</div>
        </div>
        
        {/* Data Rows */}
        {filteredProducts.map((p, idx) => (
          <div key={p.id} className={`flex border-b h-10 text-sm ${darkMode ? 'border-gray-800 text-gray-300' : 'border-gray-200 text-gray-800'}`}>
            <div className={`w-10 border-r text-center text-xs leading-10 ${darkMode ? 'bg-[#2d2d2d] border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>{idx + 1}</div>
            <div className={`w-24 border-r px-2 leading-10 overflow-hidden truncate ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{p.id.slice(0,6)}</div>
            
            {/* Image Column */}
            <div className={`w-16 border-r flex items-center justify-center ${darkMode ? 'border-gray-800 bg-[#252525]' : 'border-gray-200 bg-gray-50'}`}>
               {p.imageUrl ? (
                 <img src={p.imageUrl} alt="img" className={`h-8 w-8 object-contain border ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'}`} />
               ) : (
                 <ImageIcon size={14} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
               )}
            </div>

            <div className={`w-40 border-r px-2 leading-10 overflow-hidden truncate flex items-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{p.sku}</div>
            <div className={`w-40 border-r px-2 leading-10 overflow-hidden truncate flex items-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{p.name}</div>
            <div className={`w-40 border-r px-2 leading-10 overflow-hidden truncate flex items-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{p.category}</div>
            <div className={`w-40 border-r px-2 leading-10 text-right font-mono flex items-center justify-end ${darkMode ? 'border-gray-800 text-green-400' : 'border-gray-200 text-green-700'}`}>Rs. {p.price.toFixed(2)}</div>
            <div className={`w-40 border-r px-2 leading-10 text-right font-mono flex items-center justify-end ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{p.stock}</div>
            
            {/* Action Cell */}
            <div className={`w-12 border-r flex items-center justify-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button 
                    onClick={() => {
                        if (onDeleteProduct && window.confirm(`Are you sure you want to delete product "${p.name}"?`)) {
                            onDeleteProduct(p.id);
                        }
                    }}
                    className={`p-1 rounded hover:bg-red-100 text-red-500 transition-colors`}
                    title="Delete Product"
                >
                    <Trash2 size={14} />
                </button>
            </div>
          </div>
        ))}
      </>
    );
  };

  const renderSalesLog = () => (
    <>
      <div className={`flex border-b font-semibold text-center text-xs sticky top-0 z-10 ${darkMode ? 'bg-[#2d2d2d] border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
        <div className={`w-10 border-r ${darkMode ? 'border-gray-700 bg-[#2d2d2d]' : 'border-gray-300 bg-gray-100'}`}></div>
        {['Sale ID', 'Customer', 'Date', 'Status', 'Total', 'Paid', 'Payment', 'Items'].map((h, i) => (
          <div key={h} className={`w-40 border-r py-1 flex justify-center items-center ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
             {getColHeader(i)}
          </div>
        ))}
        {/* Void Column */}
        <div className={`w-12 border-r py-1 flex justify-center items-center ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            {getColHeader(8)}
        </div>
      </div>

      {sales.map((s, idx) => {
        const dateObj = new Date(s.date);
        const isExpanded = expandedSaleId === s.id;
        const paid = s.amountPaid !== undefined ? s.amountPaid : s.total;
        const balance = s.total - paid;
        const isDue = balance > 0.5;

        return (
          <React.Fragment key={s.id}>
             <div 
                className={`flex border-b h-6 text-sm cursor-pointer transition-colors ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-800' : 'border-gray-200 hover:bg-blue-50'} ${isExpanded ? (darkMode ? 'bg-gray-800' : 'bg-blue-100') : ''}`}
                onClick={() => setExpandedSaleId(isExpanded ? null : s.id)}
             >
                <div className={`w-10 border-r text-center text-xs leading-6 flex items-center justify-center ${darkMode ? 'bg-[#2d2d2d] border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'}`}>
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span className="ml-0.5">{idx + 1}</span>
                </div>
                <div className={`w-40 border-r px-2 leading-6 truncate font-medium ${darkMode ? 'border-gray-800 text-blue-400' : 'border-gray-200 text-blue-800'}`}>{s.id.slice(0,8)}</div>
                <div className={`w-40 border-r px-2 leading-6 truncate ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{s.customerName || 'Walk-in'}</div>
                <div className={`w-40 border-r px-2 leading-6 truncate text-right ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{dateObj.toLocaleDateString()}</div>
                
                {/* Status Column */}
                <div className={`w-40 border-r px-2 leading-6 truncate text-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                   {isDue ? (
                      <span className="bg-red-100 text-red-600 px-1 rounded text-[10px] font-bold border border-red-200">DUE {balance.toFixed(0)}</span>
                   ) : (
                      <span className="bg-green-100 text-green-700 px-1 rounded text-[10px] font-bold border border-green-200">PAID</span>
                   )}
                </div>

                <div className={`w-40 border-r px-2 leading-6 truncate text-right font-bold ${darkMode ? 'border-gray-800 text-green-400' : 'border-gray-200 text-green-700'}`}>Rs. {s.total.toFixed(2)}</div>
                <div className={`w-40 border-r px-2 leading-6 truncate text-right ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>Rs. {paid.toFixed(2)}</div>
                <div className={`w-40 border-r px-2 leading-6 truncate text-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{s.paymentMethod}</div>
                <div className={`w-40 border-r px-2 leading-6 truncate text-xs ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-600'}`}>{s.items.length} items</div>
                
                {/* Void Action */}
                <div className={`w-12 border-r flex items-center justify-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                     <button 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row expansion
                            if (onVoidSale && window.confirm("Are you sure you want to VOID this transaction? Stock will be restored.")) {
                                onVoidSale(s.id);
                            }
                        }}
                        className={`p-1 rounded hover:bg-red-100 text-red-500 transition-colors`}
                        title="Void Transaction"
                    >
                        <Ban size={12} />
                    </button>
                </div>
             </div>
             
             {isExpanded && (
                <div className={`flex border-b shadow-inner ${darkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-[#f8f9fa] border-gray-300'}`}>
                    <div className={`w-10 border-r ${darkMode ? 'bg-[#2d2d2d] border-gray-700' : 'bg-gray-100 border-gray-300'}`}></div> {/* Spacer */}
                    <div className="flex-1 p-4">
                        <div className={`border w-full max-w-3xl shadow-sm ${darkMode ? 'bg-[#2d2d2d] border-gray-700' : 'bg-white border-gray-300'}`}>
                            {/* Receipt Print Button */}
                            <div className={`flex justify-end p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <button 
                                    onClick={() => handlePrint('RECEIPT', s)}
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <Printer size={12}/> Print Receipt / Save PDF
                                </button>
                            </div>

                            <div className={`px-3 py-1 text-xs font-bold border-b flex ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                <div className="flex-1">Item Description</div>
                                <div className="w-24 text-right">Unit Price</div>
                                <div className="w-16 text-center">Qty</div>
                                <div className="w-24 text-right">Total</div>
                                <div className="w-12 text-center">Act</div>
                            </div>
                            {s.items.map((item, i) => (
                                <div key={i} className={`flex px-3 py-1 text-xs border-b ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-100 text-gray-600 hover:bg-yellow-50'}`}>
                                    <div className="flex-1 flex items-center gap-2">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt="" className={`w-4 h-4 object-cover border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}/>
                                        )}
                                        <span>{item.name}</span>
                                    </div>
                                    <div className="w-24 text-right">Rs. {item.price.toFixed(2)}</div>
                                    <div className="w-16 text-center">{item.quantity}</div>
                                    <div className={`w-24 text-right font-mono ${darkMode ? 'text-gray-200' : 'text-black'}`}>Rs. {(item.price * item.quantity).toFixed(2)}</div>
                                    <div className="w-12 flex justify-center">
                                       {/* Return Button */}
                                       {onReturnItem && s.total > 0 && ( // Only allow returns on positive sales
                                          <button 
                                            onClick={() => {
                                                const qtyStr = prompt(`Enter Quantity to RETURN for "${item.name}" (Max: ${item.quantity}):`, "1");
                                                if (qtyStr) {
                                                    const qty = parseInt(qtyStr);
                                                    if (!isNaN(qty) && qty > 0 && qty <= item.quantity) {
                                                        const reason = prompt("Enter Reason for Return:", "Defective / Exchange");
                                                        if (reason) {
                                                            onReturnItem(s.id, item, qty, reason);
                                                        }
                                                    } else {
                                                        alert("Invalid Quantity");
                                                    }
                                                }
                                            }}
                                            className="text-orange-500 hover:bg-orange-100 p-0.5 rounded"
                                            title="Return Item"
                                          >
                                            <RotateCcw size={12} />
                                          </button>
                                       )}
                                    </div>
                                </div>
                            ))}
                            {/* Notes Section */}
                            {s.notes && (
                                <div className={`px-3 py-2 border-b text-xs ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-yellow-50'}`}>
                                    <span className={`font-bold mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes:</span>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-800'} italic`}>{s.notes}</span>
                                </div>
                            )}
                            <div className={`px-3 py-1 text-xs border-t flex justify-end gap-4 font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                <span className={balance > 0.5 ? 'text-red-600' : 'text-gray-500'}>Balance: Rs. {balance.toFixed(2)}</span>
                                <span className={darkMode ? 'text-green-400' : 'text-green-700'}>Paid: Rs. {paid.toFixed(2)}</span>
                                <span className={darkMode ? 'text-white' : 'text-black'}>Grand Total: Rs. {s.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}
          </React.Fragment>
        );
      })}
    </>
  );

  const renderLedger = () => {
    // If a customer is selected, show their detailed statement (HISTORY VIEW)
    if (selectedCustomerLedger) {
        // Filter and sort sales for this customer
        const customerSales = sales
            .filter(s => (s.customerName || 'Walk-in') === selectedCustomerLedger)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first

        let runningBalance = 0;
        const totalSales = customerSales.reduce((acc, s) => acc + s.total, 0);
        const totalPaid = customerSales.reduce((acc, s) => acc + (s.amountPaid !== undefined ? s.amountPaid : s.total), 0);
        const totalDue = totalSales - totalPaid;

        return (
            <div className={`p-4 min-h-full ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-100'}`}>
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <button 
                        onClick={() => setSelectedCustomerLedger(null)}
                        className={`flex items-center gap-2 border px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-[#2d2d2d] text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        <ArrowLeft size={14} /> Back to List
                    </button>
                    <button 
                        onClick={() => handlePrint('STATEMENT', { customerName: selectedCustomerLedger, sales: customerSales })} 
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors text-sm"
                    >
                        <Printer size={16} /> Print Statement
                    </button>
                </div>

                <div className={`border shadow-sm p-8 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 ${darkMode ? 'bg-[#2d2d2d] border-gray-700' : 'bg-white border-gray-300'}`}>
                    {/* Statement Header */}
                    <div className={`border-b-2 pb-4 mb-6 flex justify-between items-end ${darkMode ? 'border-gray-600' : 'border-gray-800'}`}>
                        <div>
                            <h1 className={`text-2xl font-bold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Customer Statement</h1>
                            <p className="text-gray-500 text-sm mt-1">PK General Store & Cosmetics</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Account:</div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>{selectedCustomerLedger}</div>
                            <div className="text-xs text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className={`p-4 border rounded print:border-gray-300 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="text-gray-500 text-xs uppercase font-semibold">Total Purchases</div>
                            <div className={`text-xl font-mono font-bold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Rs. {totalSales.toLocaleString()}</div>
                        </div>
                        <div className={`p-4 border rounded print:border-gray-300 ${darkMode ? 'bg-green-900/30 border-green-900/50' : 'bg-green-50 border-green-100'}`}>
                            <div className="text-green-600 text-xs uppercase font-semibold">Total Paid</div>
                            <div className="text-xl font-mono font-bold text-green-700 mt-1">Rs. {totalPaid.toLocaleString()}</div>
                        </div>
                        <div className={`p-4 border rounded print:border-gray-300 ${darkMode ? 'bg-red-900/30 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
                            <div className="text-red-600 text-xs uppercase font-semibold">Current Balance</div>
                            <div className="text-xl font-mono font-bold text-red-700 mt-1">Rs. {totalDue.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Detailed History Table */}
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className={`border-b text-left ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                                <th className={`py-2 px-3 border-r w-8 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></th>
                                <th className={`py-2 px-3 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Date</th>
                                <th className={`py-2 px-3 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Ref ID</th>
                                <th className={`py-2 px-3 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Description</th>
                                <th className={`py-2 px-3 border-r text-right ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Debit</th>
                                <th className={`py-2 px-3 border-r text-right ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Credit</th>
                                <th className={`py-2 px-3 text-right ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerSales.map((s) => {
                                const paid = s.amountPaid !== undefined ? s.amountPaid : s.total;
                                const debit = s.total;
                                const credit = paid;
                                runningBalance += (debit - credit);
                                const isExpanded = expandedSaleId === s.id;

                                return (
                                    <React.Fragment key={s.id}>
                                    <tr 
                                        onClick={() => setExpandedSaleId(isExpanded ? null : s.id)}
                                        className={`border-b cursor-pointer print:hover:bg-transparent ${darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-800'} ${isExpanded ? (darkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}
                                    >
                                        <td className={`py-2 px-3 border-r text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                        </td>
                                        <td className={`py-2 px-3 border-r font-mono text-xs ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-600'}`}>
                                            {new Date(s.date).toLocaleDateString()}
                                        </td>
                                        <td className={`py-2 px-3 border-r font-mono text-xs ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>{s.id.slice(0, 6)}</td>
                                        <td className={`py-2 px-3 border-r truncate max-w-[200px] ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                                            Sale ({s.items.length} items) - {s.paymentMethod}
                                        </td>
                                        <td className={`py-2 px-3 border-r text-right font-medium ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {debit > 0 ? debit.toLocaleString() : (debit < 0 ? `(${Math.abs(debit).toLocaleString()})` : '-')}
                                        </td>
                                        <td className={`py-2 px-3 border-r text-right text-green-700 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {credit > 0 ? credit.toLocaleString() : (credit < 0 ? `(${Math.abs(credit).toLocaleString()})` : '-')}
                                        </td>
                                        <td className={`py-2 px-3 text-right font-bold font-mono ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <span className={runningBalance > 0.5 ? 'text-red-600' : 'text-green-600'}>
                                                {runningBalance.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className={`print:hidden ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                                            <td colSpan={7} className="p-3 border-b border-gray-200">
                                                <div className={`p-2 border rounded text-xs ${darkMode ? 'border-gray-700 bg-[#2d2d2d]' : 'border-gray-200 bg-white'}`}>
                                                    <div className="font-semibold mb-2 opacity-50 uppercase tracking-wider text-[10px]">Transaction Details</div>
                                                    <table className="w-full mb-2">
                                                        <thead>
                                                            <tr className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                <th className="text-left py-1">Item</th>
                                                                <th className="text-right py-1">Qty</th>
                                                                <th className="text-right py-1">Price</th>
                                                                <th className="text-right py-1">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {s.items.map((item, i) => (
                                                                <tr key={i} className={`border-b border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                                                    <td className="py-1">{item.name}</td>
                                                                    <td className="text-right py-1">{item.quantity}</td>
                                                                    <td className="text-right py-1">{item.price}</td>
                                                                    <td className="text-right py-1">{(item.price * item.quantity).toFixed(0)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {s.notes && (
                                                        <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-yellow-50'}`}>
                                                            <span className="font-bold">Note: </span>{s.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                );
                            })}
                            <tr className={`font-bold border-t-2 ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300'}`}>
                                <td colSpan={4} className="py-2 px-3 text-right">Ending Balance</td>
                                <td className="py-2 px-3 text-right">{totalSales.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right">{totalPaid.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-mono text-lg">
                                    <span className={totalDue > 0.5 ? 'text-red-700' : 'text-green-700'}>
                                        Rs. {totalDue.toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div className="mt-8 pt-8 border-t border-gray-300 flex justify-between text-xs text-gray-500 print:flex">
                        <div>Software Generated Statement - PK General Store</div>
                        <div>Page 1 of 1</div>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Customer Directory (LIST VIEW)
    // Aggregate data by customer
    const customerMap = new Map<string, { total: number, paid: number, count: number, lastDate: string }>();

    sales.forEach(s => {
        const name = s.customerName || 'Walk-in';
        const paid = s.amountPaid !== undefined ? s.amountPaid : s.total;
        
        if (!customerMap.has(name)) {
            customerMap.set(name, { total: 0, paid: 0, count: 0, lastDate: s.date });
        }
        const entry = customerMap.get(name)!;
        entry.total += s.total;
        entry.paid += paid;
        entry.count += 1;
        if (new Date(s.date) > new Date(entry.lastDate)) {
            entry.lastDate = s.date;
        }
    });

    const customers = Array.from(customerMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .filter(c => c.name.toLowerCase().includes(ledgerSearch.toLowerCase()))
        .sort((a, b) => b.total - a.total); // Sort by total value desc

    return (
      <div className={`p-4 min-h-full ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-100'}`}>
         <div className="flex justify-between items-center mb-4 print:hidden">
             <div className="relative w-80">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Search Accounts..." 
                    className={`w-full pl-10 pr-4 py-2 border rounded shadow-sm focus:border-blue-500 focus:outline-none ${darkMode ? 'bg-[#2d2d2d] border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    autoFocus
                />
             </div>
         </div>

         <div className={`border shadow-sm overflow-hidden ${darkMode ? 'bg-[#2d2d2d] border-gray-700' : 'bg-white border-gray-300'}`}>
             <div className={`px-4 py-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                 <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <User size={18}/> Party / Customer Directory
                 </h2>
             </div>
             <table className="w-full text-sm">
                <thead>
                    <tr className={`border-b text-left ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Last Activity</th>
                        <th className="py-3 px-4 text-center">Trans. Count</th>
                        <th className="py-3 px-4 text-right">Total Sales</th>
                        <th className="py-3 px-4 text-right">Balance Due</th>
                        <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c, idx) => {
                        const balance = c.total - c.paid;
                        return (
                            <tr key={idx} className={`border-b transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-100 hover:bg-blue-50 text-gray-800'}`}>
                                <td className={`py-3 px-4 font-medium ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>{c.name}</td>
                                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(c.lastDate).toLocaleDateString()}</td>
                                <td className="py-3 px-4 text-center">{c.count}</td>
                                <td className="py-3 px-4 text-right font-medium">{c.total.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right font-bold">
                                    <span className={balance > 0.5 ? "text-red-600" : "text-green-600"}>
                                        Rs. {balance.toLocaleString()}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button 
                                        onClick={() => setSelectedCustomerLedger(c.name)}
                                        className={`flex items-center justify-center gap-1 mx-auto border px-2 py-1 rounded text-xs ${darkMode ? 'border-blue-800 bg-blue-900/30 text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800 border-blue-200 bg-blue-50'}`}
                                    >
                                        <FileText size={12} /> View History
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {customers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                                No accounts found matching "{ledgerSearch}"
                            </td>
                        </tr>
                    )}
                </tbody>
             </table>
         </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 overflow-auto relative cursor-cell print:overflow-visible ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      {renderPrintPreview()}
      {view === SheetView.INVENTORY && renderInventory()}
      {view === SheetView.SALES_LOG && renderSalesLog()}
      {view === SheetView.LEDGER && renderLedger()}
      
      {/* Selection Box Simulation */}
      {view !== SheetView.LEDGER && view !== SheetView.DASHBOARD && (
        <div 
            className="absolute left-[41px] w-[159px] h-[39px] border-2 border-[#107C41] pointer-events-none z-0 mix-blend-multiply opacity-50 transition-all duration-75 print:hidden"
            style={{ top: view === SheetView.INVENTORY ? '66px' : '25px', height: view === SheetView.INVENTORY ? '39px' : '23px' }}
        >
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#107C41] border border-white"></div>
        </div>
      )}

      {view === SheetView.DASHBOARD && (
          <div className={`p-8 h-full overflow-y-auto ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
            <div className={`max-w-5xl mx-auto ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className={`border rounded shadow-sm p-4 flex items-center gap-4 ${darkMode ? 'bg-[#2b2b2b] border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold">Most Sold Product (Qty)</div>
                            {mostSold ? (
                                <div>
                                    <div className="text-xl font-bold">{mostSold.name}</div>
                                    <div className="text-sm text-gray-400">{mostSold.qty} units sold</div>
                                </div>
                            ) : (
                                <div className="text-sm italic text-gray-400">No data</div>
                            )}
                        </div>
                    </div>

                    <div className={`border rounded shadow-sm p-4 flex items-center gap-4 ${darkMode ? 'bg-[#2b2b2b] border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold">Top Revenue Product</div>
                             {topRevenue ? (
                                <div>
                                    <div className="text-xl font-bold">{topRevenue.name}</div>
                                    <div className="text-sm text-gray-400">Rs. {topRevenue.revenue.toLocaleString()} generated</div>
                                </div>
                            ) : (
                                <div className="text-sm italic text-gray-400">No data</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Report Container */}
               {/* Note: In a real refactor we'd pass the analysis as a prop, but here we reuse the existing layout */}
            </div>
          </div>
      )}
    </div>
  );
};

// Receipt Template Component
const PrintReceiptTemplate: React.FC<{ sale: SaleRecord }> = ({ sale }) => {
    const paid = sale.amountPaid !== undefined ? sale.amountPaid : sale.total;
    const balance = sale.total - paid;

    return (
        <div className="w-[80mm] mx-auto bg-white p-2 font-mono text-xs">
            <div className="text-center border-b-2 border-dashed pb-2 mb-2">
                <h2 className="font-bold text-lg">PK GENERAL STORE</h2>
                <div className="text-[10px]">Cosmetics & Garments</div>
                <div className="text-[10px]">Opposite City Park, Main Bazar</div>
                <div className="text-[10px]">Tel: 0300-1234567</div>
            </div>
            
            <div className="flex justify-between text-[10px] mb-2">
                <div>Inv: {sale.id.slice(0,8)}</div>
                <div>{new Date(sale.date).toLocaleString()}</div>
            </div>
            <div className="mb-2 text-[10px]">Customer: {sale.customerName || 'Walk-in'}</div>

            <table className="w-full text-left mb-2">
                <thead>
                    <tr className="border-b">
                        <th className="py-1">Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-0.5 max-w-[40mm] truncate">{item.name}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">{(item.price * item.quantity).toFixed(0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t-2 border-dashed pt-2">
                <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span>Rs. {sale.total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                    <span>PAID:</span>
                    <span>Rs. {paid.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                    <span>BALANCE:</span>
                    <span>Rs. {balance.toFixed(0)}</span>
                </div>
            </div>

            <div className="text-center mt-4 text-[10px]">
                <div className="mb-1">** Thank You for Visiting **</div>
                <div>No Return without Receipt</div>
                <div>Software by Aseem Khan</div>
            </div>
        </div>
    );
};

// Statement Template Component
const PrintStatementTemplate: React.FC<{ customerName: string, sales: SaleRecord[] }> = ({ customerName, sales }) => {
    let runningBalance = 0;
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalPaid = sales.reduce((acc, s) => acc + (s.amountPaid !== undefined ? s.amountPaid : s.total), 0);
    
    return (
        <div className="w-[210mm] mx-auto bg-white p-10 font-sans">
             <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
                 <div>
                     <h1 className="text-2xl font-bold">PK GENERAL STORE</h1>
                     <div>Main Market, Pakistan</div>
                     <div>Phone: 0345-0900064</div>
                 </div>
                 <div className="text-right">
                     <h2 className="text-xl font-semibold uppercase text-gray-600">Statement of Account</h2>
                     <div className="mt-2 font-bold text-lg">{customerName}</div>
                     <div className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</div>
                 </div>
             </div>

             <table className="w-full text-sm border-collapse mb-8">
                <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold">
                        <td className="p-2 border">Date</td>
                        <td className="p-2 border">Ref #</td>
                        <td className="p-2 border">Description</td>
                        <td className="p-2 border text-right">Debit</td>
                        <td className="p-2 border text-right">Credit</td>
                        <td className="p-2 border text-right">Balance</td>
                    </tr>
                </thead>
                <tbody>
                    {sales.map((s, i) => {
                        const paid = s.amountPaid !== undefined ? s.amountPaid : s.total;
                        const debit = s.total;
                        const credit = paid;
                        runningBalance += (debit - credit);
                        
                        return (
                            <tr key={i} className="border-b">
                                <td className="p-2 border">{new Date(s.date).toLocaleDateString()}</td>
                                <td className="p-2 border">{s.id.slice(0,6)}</td>
                                <td className="p-2 border truncate max-w-[200px]">{s.paymentMethod}</td>
                                <td className="p-2 border text-right">{debit !== 0 ? debit.toLocaleString() : '-'}</td>
                                <td className="p-2 border text-right">{credit !== 0 ? credit.toLocaleString() : '-'}</td>
                                <td className="p-2 border text-right font-bold">{runningBalance.toLocaleString()}</td>
                            </tr>
                        );
                    })}
                    <tr className="bg-gray-100 font-bold border-t-2 border-black">
                        <td colSpan={3} className="p-2 border text-right">Totals</td>
                        <td className="p-2 border text-right">{totalSales.toLocaleString()}</td>
                        <td className="p-2 border text-right">{totalPaid.toLocaleString()}</td>
                        <td className="p-2 border text-right">{runningBalance.toLocaleString()}</td>
                    </tr>
                </tbody>
             </table>

             <div className="flex justify-between mt-12 pt-8 border-t">
                 <div className="text-center">
                     <div className="border-t border-black w-40 mb-2"></div>
                     <div className="text-xs">Accountant Signature</div>
                 </div>
                 <div className="text-center">
                     <div className="border-t border-black w-40 mb-2"></div>
                     <div className="text-xs">Customer Signature</div>
                 </div>
             </div>
        </div>
    );
};