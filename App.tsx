import React, { useState, useEffect } from 'react';
import { Product, CartItem, SaleRecord, SheetView, User, AuthStep } from './types';
import { ExcelSheet } from './components/ExcelSheet';
import { VbaUserForm } from './components/VbaUserForm';
import { AddProductForm } from './components/AddProductForm';
import { AuthForms } from './components/AuthForms';
import { analyzeSalesData } from './services/geminiService';
import { 
  Save, Printer, Play, BarChart3, HelpCircle, 
  Menu, FileSpreadsheet, PlusCircle, Search, 
  ChevronDown, Minimize2, X, Sparkles, PackagePlus,
  Users, Moon, Sun, LogOut
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Updated Product Catalog for Pakistani General Store & Cosmetics
const INITIAL_PRODUCTS: Product[] = [
  { id: '101', sku: 'SHM-001', name: 'Sunsilk Black Shine (360ml)', price: 650, category: 'Personal Care', stock: 50 },
  { id: '102', sku: 'SHM-002', name: 'Lifebuoy Herbal Shampoo', price: 550, category: 'Personal Care', stock: 45 },
  { id: '103', sku: 'FW-001',  name: 'Ponds White Beauty Face Wash', price: 450, category: 'Cosmetics', stock: 30 },
  { id: '104', sku: 'FW-002',  name: 'Himalaya Neem Face Wash', price: 600, category: 'Cosmetics', stock: 25 },
  { id: '105', sku: 'SB-001',  name: 'Rivaj UK Sunblock SPF60', price: 850, category: 'Cosmetics', stock: 20 },
  { id: '106', sku: 'SB-002',  name: 'U-Veil Forte Sunscreen', price: 950, category: 'Cosmetics', stock: 15 },
  { id: '107', sku: 'GM-001',  name: 'IFG Cotton Bra (Classic)', price: 1200, category: 'Garments', stock: 60 },
  { id: '108', sku: 'PC-001',  name: 'Veet Hair Removal Cream', price: 180, category: 'Personal Care', stock: 100 },
  { id: '109', sku: 'PC-002',  name: 'Vaseline Healthy White Lotion', price: 950, category: 'Personal Care', stock: 40 },
  { id: '110', sku: 'GM-002',  name: 'Ladies Thermal Inner', price: 800, category: 'Garments', stock: 30 },
  { id: '111', sku: 'GM-003',  name: 'Winter Wool Sweater', price: 2500, category: 'Garments', stock: 10 },
  { id: '112', sku: 'ACC-001', name: 'Wide Tooth Comb', price: 120, category: 'Accessories', stock: 150 },
  { id: '113', sku: 'SOP-001', name: 'Lux Rose & Vitamin E Soap', price: 140, category: 'Personal Care', stock: 200 },
  { id: '114', sku: 'SOP-002', name: 'Tibet Beauty Soap', price: 90, category: 'Personal Care', stock: 180 },
  { id: '115', sku: 'CRM-001', name: 'Golden Pearl Beauty Cream', price: 350, category: 'Cosmetics', stock: 80 },
  { id: '116', sku: 'CRM-002', name: 'Glow & Lovely Cream', price: 420, category: 'Cosmetics', stock: 90 },
  { id: '117', sku: 'GM-004',  name: 'Cotton Ankle Socks (Pair)', price: 150, category: 'Garments', stock: 300 },
  { id: '118', sku: 'PC-003',  name: 'Saeed Ghani Rose Water', price: 200, category: 'Personal Care', stock: 60 },
];

const STORAGE_KEYS = {
  PRODUCTS: 'pk_store_products_v1',
  CART: 'pk_store_cart_v1',
  SALES: 'pk_store_sales_v1',
  USERS: 'pk_store_users_v1',
  SYSTEM_ID: 'pk_store_sys_id_v1',
  LICENSE_KEY: 'pk_store_license_key_v1'
};

const CREATOR_PASSWORD = "RealKingOne1"; // Used for Admin tasks (Recovery, Void, etc.)

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<SheetView>(SheetView.INVENTORY);
  const [darkMode, setDarkMode] = useState(false);
  
  // Auth State
  const [authStep, setAuthStep] = useState<AuthStep>('CREATOR_CHECK');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [systemID, setSystemID] = useState<string>('');
  
  // Initialize Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch { return INITIAL_PRODUCTS; }
  });

  // Initialize Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Initialize Sales
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Initialize Users
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isPosOpen, setIsPosOpen] = useState<boolean>(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // --- LICENSE / SYSTEM ID LOGIC ---
  useEffect(() => {
    // 1. Get or Generate System ID
    let sysId = localStorage.getItem(STORAGE_KEYS.SYSTEM_ID);
    if (!sysId) {
        // Generate a random ID: SYS-XXXX-XXXX
        sysId = 'SYS-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        localStorage.setItem(STORAGE_KEYS.SYSTEM_ID, sysId);
    }
    setSystemID(sysId);

    // 2. Check Validity
    const savedKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    // Formula: Base64(SystemID + CreatorPassword)
    const expectedKey = btoa(sysId + CREATOR_PASSWORD);
    
    // DEV TOOL: Log the key to console so the "Developer" (Aseem) can see it easily
    console.log("%c [ACTIVATION TOOL] ", "background: #222; color: #bada55");
    console.log(`System ID: ${sysId}`);
    console.log(`Expected Key: ${expectedKey}`);
    console.log("Provide this key to activate the app.");

    if (savedKey === expectedKey) {
        // Already Activated
        setAuthStep('LOGIN');
    } else {
        // Not Activated
        setAuthStep('CREATOR_CHECK'); 
    }
  }, []);

  // Persistence Effects
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);

  // Auth Handlers
  const handleActivation = (inputKey: string) => {
    const expectedKey = btoa(systemID + CREATOR_PASSWORD);
    
    if (inputKey.trim() === expectedKey) {
        localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, inputKey);
        alert("Activation Successful! Application Unlocked.");
        
        if (users.length === 0) {
            alert("Welcome! It looks like you don’t have an account yet. Please sign up to continue.");
            setAuthStep('SIGNUP');
        } else {
            setAuthStep('LOGIN');
        }
    } else {
        alert("Invalid Activation Key. Please contact vendor.");
    }
  };

  const handleAdminVerify = (password: string): boolean => {
    return password === CREATOR_PASSWORD;
  };

  const handleLogin = (userId: string, pass: string) => {
    const user = users.find(u => u.userId === userId && u.password === pass);
    if (user) {
        setCurrentUser(user);
        setAuthStep('APP');
        setIsPosOpen(true);
    } else {
        alert("Invalid User ID or Password.");
    }
  };

  const handleSignup = (user: User) => {
    // Check user ID exists
    if (users.some(u => u.userId === user.userId)) {
        alert("User ID already taken.");
        return;
    }
    setUsers(prev => [...prev, user]);
    alert("Registration Successful! Please Login.");
    setAuthStep('LOGIN');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthStep('LOGIN');
  };

  // Cart Logic
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAddToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.price === product.price);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.price === product.price) ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = (method: string, customerName: string, amountPaid: number, notes: string) => {
    const newSale: SaleRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      paymentMethod: method,
      customerName: customerName,
      amountPaid: amountPaid,
      notes: notes
    };

    setSales(prev => [newSale, ...prev]);
    
    setProducts(prev => prev.map(p => {
      const soldQty = cart.filter(c => c.id === p.id).reduce((sum, c) => sum + c.quantity, 0);
      if (soldQty > 0) return { ...p, stock: p.stock - soldQty };
      return p;
    }));

    setCart([]);
    setActiveView(SheetView.SALES_LOG);
  };

  const handleAddNewProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: Math.random().toString(36).substr(2, 9).toUpperCase()
    };
    setProducts(prev => [...prev, newProduct]);
    setActiveView(SheetView.INVENTORY);
  };

  const handleDeleteProduct = (productId: string) => {
    // Security check: Only Creator/Admin can delete from database
    const password = prompt("Enter Admin Password to DELETE item from database permanently:");
    if (password === CREATOR_PASSWORD) {
        setProducts(prev => prev.filter(p => p.id !== productId));
    } else {
        if (password !== null) alert("Access Denied. Incorrect Password.");
    }
  };

  const handleVoidSale = (saleId: string) => {
    // Security check: Only Creator/Admin can void sales
    const password = prompt("Enter Admin Password to VOID transaction and restore stock:");
    if (password === CREATOR_PASSWORD) {
        const saleToVoid = sales.find(s => s.id === saleId);
        if (saleToVoid) {
            // Restore Stock
            setProducts(prev => prev.map(p => {
                const item = saleToVoid.items.find(i => i.id === p.id);
                if (item) {
                    return { ...p, stock: p.stock + item.quantity };
                }
                return p;
            }));
            // Remove Sale
            setSales(prev => prev.filter(s => s.id !== saleId));
        }
    } else {
        if (password !== null) alert("Access Denied. Incorrect Password.");
    }
  };

  const handleReturnItem = (originalSaleId: string, item: CartItem, returnQty: number, reason: string) => {
    const password = prompt("Enter Admin Password to authorize RETURN:");
    if (password !== CREATOR_PASSWORD) {
        if (password !== null) alert("Access Denied.");
        return;
    }

    // 1. Identify original sale (for reference in notes)
    const originalSale = sales.find(s => s.id === originalSaleId);
    
    // 2. Create Refund Record (Negative Sale)
    const refundTotal = -1 * (item.price * returnQty);
    const refundRecord: SaleRecord = {
        id: 'RET-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        date: new Date().toISOString(),
        items: [{...item, quantity: returnQty}],
        total: refundTotal,
        amountPaid: refundTotal, // Refund is fully paid out
        paymentMethod: 'Refund',
        customerName: originalSale ? originalSale.customerName : 'Unknown',
        notes: `RETURN: ${returnQty}x ${item.name} from Sale #${originalSaleId}. Reason: ${reason}`
    };

    // 3. Update Inventory (Add Stock Back)
    setProducts(prev => prev.map(p => {
        if (p.id === item.id) {
            return { ...p, stock: p.stock + returnQty };
        }
        return p;
    }));

    // 4. Add Refund Record to Sales
    setSales(prev => [refundRecord, ...prev]);
    alert("Return Processed Successfully. Inventory Updated.");
  };

  const runAnalysis = async () => {
    if (sales.length === 0) {
      setAiAnalysis("No sales data available to analyze yet.");
      return;
    }
    setIsAnalysisLoading(true);
    setActiveView(SheetView.DASHBOARD);
    const result = await analyzeSalesData(sales, products);
    setAiAnalysis(result);
    setIsAnalysisLoading(false);
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden text-sm print:bg-white print:h-auto ${darkMode ? 'bg-[#1e1e1e] text-gray-200' : 'bg-gray-100 text-black'}`}>
      
      {/* Authentication Overlay */}
      <AuthForms 
         authStep={authStep}
         onCreatorCheck={handleActivation} // Renamed prop usage to better reflect logic
         onLogin={handleLogin}
         onSignup={handleSignup}
         onSwitchToSignup={() => setAuthStep('SIGNUP')}
         onSwitchToLogin={() => setAuthStep('LOGIN')}
         onSwitchToRecovery={() => setAuthStep('RECOVERY')}
         onAdminVerify={handleAdminVerify}
         users={users}
         darkMode={darkMode}
         systemID={systemID}
      />

      {/* --- Excel Title Bar (Hidden on print) --- */}
      <div className={`h-8 flex items-center justify-between px-4 text-white select-none print:hidden ${darkMode ? 'bg-[#0b5c30]' : 'bg-[#107C41]'}`}>
        <div className="flex items-center gap-4">
          <Menu size={16} />
          <div className="flex gap-2 text-xs items-baseline">
            <span className="font-semibold">AutoSave</span>
            <div className="w-8 h-4 bg-white/20 rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="mx-2 opacity-50">|</span>
            <span className="font-semibold text-sm">PK_GeneralStore_POS_v3.xlsm</span>
            <span className="bg-white/20 text-[10px] px-1 rounded ml-2">Saved</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="hover:bg-white/10 p-1 rounded">
             {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="bg-white/20 flex items-center px-4 py-1 rounded w-64 text-xs text-white/70">
            <Search size={12} className="mr-2" />
            <span>Search</span>
          </div>
          {currentUser && (
            <div className="flex gap-2 text-xs items-center">
                <span>{currentUser.firstName} {currentUser.lastName}</span>
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                </div>
                <button onClick={handleLogout} className="ml-2 hover:bg-red-500 p-1 rounded" title="Log Out">
                    <LogOut size={14} />
                </button>
            </div>
          )}
          <div className="flex gap-4 ml-4">
            <Minimize2 size={14} />
            <div className="border border-white/50 w-3 h-3"></div>
            <X size={16} />
          </div>
        </div>
      </div>

      {/* --- Ribbon (Hidden on print) --- */}
      <div className={`border-b flex flex-col print:hidden ${darkMode ? 'bg-[#2b2b2b] border-gray-600' : 'bg-[#f3f2f1] border-gray-300'}`}>
        {/* Ribbon Tabs */}
        <div className="flex px-2 pt-1 gap-1">
          <div className={`px-4 py-1 border-t-2 border-l border-r font-semibold text-xs rounded-t-sm shadow-sm z-10 -mb-px ${darkMode ? 'bg-[#1e1e1e] text-[#107C41] border-[#107C41]' : 'bg-white text-[#107C41] border-[#107C41]'}`}>Home</div>
          {['Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View', 'Developer', 'Help'].map(tab => (
            <div key={tab} className={`px-4 py-1 cursor-pointer text-xs rounded-t-sm border-t-2 border-transparent ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}>{tab}</div>
          ))}
        </div>

        {/* Ribbon Content (Toolbar) */}
        <div className={`p-2 h-24 flex items-center gap-2 shadow-sm relative z-0 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          
          {/* Clipboard Group */}
          <div className={`flex flex-col items-center justify-between h-full px-2 border-r min-w-[60px] ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
             <div className="flex gap-1 mb-1">
               <div className="flex flex-col gap-1">
                 <div className={`p-1 rounded cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><Save size={16} color="#107C41"/></div>
                 <div className={`p-1 rounded cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><Printer size={16} className={darkMode ? 'text-gray-300' : ''} /></div>
               </div>
               <div className={`flex flex-col items-center justify-center p-2 rounded cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <FileSpreadsheet size={24} className={darkMode ? 'text-gray-400' : 'text-gray-500'}/>
                  <span className={`text-[10px] mt-1 ${darkMode ? 'text-gray-300' : ''}`}>Paste</span>
               </div>
             </div>
             <span className="text-[10px] text-gray-400 -mt-1">Clipboard</span>
          </div>

          {/* POS Controls Group */}
          <div className={`flex flex-col items-center justify-between h-full px-4 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
             <div className="flex gap-4">
                <button 
                  onClick={() => setIsPosOpen(true)}
                  className={`flex flex-col items-center p-1 rounded active:bg-opacity-80 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <div className={`w-8 h-8 rounded border flex items-center justify-center mb-1 ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-100 border-green-600'}`}>
                    <Play size={16} className={`ml-0.5 ${darkMode ? 'text-green-400' : 'text-green-700'}`} />
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-200' : ''}`}>Run POS</span>
                </button>

                 <button 
                  onClick={() => setActiveView(SheetView.SALES_LOG)}
                  className={`flex flex-col items-center p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <BarChart3 size={24} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-1`} />
                  <span className={`text-xs ${darkMode ? 'text-gray-200' : ''}`}>View Sales</span>
                </button>
             </div>
             <span className="text-[10px] text-gray-400">Application</span>
          </div>

           {/* Analysis Group */}
           <div className={`flex flex-col items-center justify-between h-full px-4 border-r ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
             <div className="flex gap-4">
                <button 
                  onClick={runAnalysis}
                  className={`flex flex-col items-center p-1 rounded group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'}`}
                >
                  <div className="relative">
                    <Sparkles size={24} className={`${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-1 ${isAnalysisLoading ? 'animate-pulse' : ''}`} />
                    {isAnalysisLoading && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>}
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-gray-200' : ''}`}>AI Insights</span>
                </button>

                <button 
                  onClick={() => setIsAddProductOpen(true)}
                  className={`flex flex-col items-center p-1 rounded group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                >
                   <div className={`w-8 h-8 rounded border flex items-center justify-center mb-1 ${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-100 border-blue-600'}`}>
                    <PackagePlus size={16} className={`${darkMode ? 'text-blue-400' : 'text-blue-700'}`} />
                   </div>
                  <span className={`text-xs ${darkMode ? 'text-gray-200' : ''}`}>Add Item</span>
                </button>
             </div>
             <span className="text-[10px] text-gray-400">Intelligence & Data</span>
          </div>

        </div>
      </div>

      {/* --- Formula Bar (Hidden on print) --- */}
      <div className={`flex items-center gap-2 p-1 border-b text-xs print:hidden ${darkMode ? 'bg-[#1e1e1e] border-gray-600' : 'bg-white border-gray-300'}`}>
        <div className={`w-24 border px-2 py-0.5 truncate ${darkMode ? 'bg-[#2b2b2b] border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-600'}`}>A1</div>
        <div className="flex gap-2 text-gray-400 px-2">
            <span>✕</span>
            <span>✓</span>
            <span className="font-serif italic font-bold">fx</span>
        </div>
        <div className={`flex-1 border px-2 py-0.5 h-full flex items-center ${darkMode ? 'bg-[#2b2b2b] border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}>
            {activeView === SheetView.INVENTORY ? '=VLOOKUP(Product_ID, Inventory!A:F, 2, FALSE)' : ''}
            {activeView === SheetView.SALES_LOG ? '=SUM(Daily_Sales!E:E)' : ''}
            {activeView === SheetView.LEDGER ? '=SUMIF(Transactions!B:B, Current_Customer, Transactions!F:F)' : ''}
        </div>
        <div className="w-8 flex justify-center text-gray-400"><ChevronDown size={14}/></div>
      </div>

      {/* --- Main Content Area (Grid + Canvas) --- */}
      <div className={`flex-1 flex overflow-hidden relative print:h-auto print:overflow-visible print:bg-white ${darkMode ? 'bg-[#333]' : 'bg-[#e6e6e6]'}`}>
        
        {/* The Grid Component */}
        <div className={`flex-1 flex flex-col h-full relative print:h-auto ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
           
           {/* If Dashboard View */}
           {activeView === SheetView.DASHBOARD ? (
             <div className={`p-8 h-full overflow-y-auto ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                {/* Handled in ExcelSheet Component via props now, but container is here */}
                <ExcelSheet 
                  view={activeView} 
                  products={products} 
                  sales={sales} 
                  darkMode={darkMode}
                  onDeleteProduct={handleDeleteProduct}
                  onVoidSale={handleVoidSale} 
                  onReturnItem={handleReturnItem}
                />
                
                {/* AI Text Block rendered here to keep context in dashboard view layout inside App */}
                <div className={`max-w-5xl mx-auto border shadow-lg p-8 relative mt-8 ${darkMode ? 'bg-[#2b2b2b] border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`absolute top-0 left-0 px-2 py-1 text-xs border font-mono shadow-sm transform -translate-y-1/2 translate-x-4 ${darkMode ? 'bg-yellow-900 border-yellow-800 text-yellow-200' : 'bg-yellow-100 border-yellow-300 text-yellow-800'}`}>
                        AI Analysis
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className={`h-64 border p-4 rounded ${darkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                            <h3 className={`text-sm font-bold mb-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue by Sale</h3>
                            {sales.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sales.slice(0, 10).reverse()}>
                                        <XAxis dataKey="id" tick={{fontSize: 10, fill: darkMode ? '#aaa' : '#666'}} interval={0} tickFormatter={(val) => val.slice(0,4)} />
                                        <YAxis tick={{fontSize: 10, fill: darkMode ? '#aaa' : '#666'}} />
                                        <Tooltip 
                                            formatter={(value) => `Rs. ${value}`} 
                                            contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderColor: darkMode ? '#666' : '#ccc', color: darkMode ? '#eee' : '#000' }} 
                                        />
                                        <Bar dataKey="total" fill="#107C41" radius={[4, 4, 0, 0]}>
                                            {sales.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#107C41' : '#217346'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 italic">No Data</div>
                            )}
                        </div>
                        <div className={`font-serif text-lg leading-relaxed p-6 rounded border shadow-inner whitespace-pre-line ${darkMode ? 'bg-yellow-900/10 text-gray-300 border-yellow-900/30' : 'text-gray-800 bg-yellow-50 border-yellow-100'}`}>
                            {isAnalysisLoading ? "Analyst is thinking..." : (aiAnalysis || "Click 'AI Insights' in the ribbon to generate a report.")}
                        </div>
                    </div>
                </div>
             </div>
           ) : (
              <ExcelSheet 
                view={activeView} 
                products={products} 
                sales={sales} 
                darkMode={darkMode}
                onDeleteProduct={handleDeleteProduct}
                onVoidSale={handleVoidSale}
                onReturnItem={handleReturnItem} 
              />
           )}
        </div>

        {/* The Floating VBA UserForms (Hidden on print) */}
        <div className="print:hidden">
            <VbaUserForm 
            products={products}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckout}
            cart={cart}
            total={cartTotal}
            isOpen={isPosOpen && authStep === 'APP'}
            onClose={() => setIsPosOpen(false)}
            darkMode={darkMode}
            />
            
            <AddProductForm 
            isOpen={isAddProductOpen && authStep === 'APP'}
            onClose={() => setIsAddProductOpen(false)}
            onSave={handleAddNewProduct}
            existingProducts={products}
            darkMode={darkMode}
            />
        </div>
      </div>

      {/* --- Status Bar (Hidden on print) --- */}
      <div className={`h-6 text-white flex items-center justify-between px-2 text-xs select-none print:hidden ${darkMode ? 'bg-[#0b5c30]' : 'bg-[#107C41]'}`}>
        <div className="flex gap-4">
           <span className="font-semibold">{authStep === 'APP' ? 'Ready' : 'Locked'}</span>
           {isAnalysisLoading && <span>Calculating Threads...</span>}
        </div>
        <div className="flex gap-4 mr-4">
           <span>Average: Rs. {sales.length > 0 ? (sales.reduce((acc, c) => acc + c.total, 0) / sales.length).toFixed(2) : '0.00'}</span>
           <span>Count: {sales.length}</span>
           <span>Sum: Rs. {sales.reduce((acc, c) => acc + c.total, 0).toFixed(2)}</span>
           <div className="flex gap-2 ml-4">
             <div className="w-16 bg-white/30 h-3 rounded-full mt-0.5"></div>
             <span>100%</span>
           </div>
        </div>
      </div>

       {/* --- Sheet Tabs (Hidden on print) --- */}
       <div className={`h-8 flex items-end px-2 border-t gap-1 absolute bottom-6 w-full z-10 print:hidden ${darkMode ? 'bg-[#2b2b2b] border-gray-600' : 'bg-[#f3f2f1] border-gray-300'}`}>
          <button className={`px-2 pb-1 rounded ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-300'}`}><PlusCircle size={14} /></button>
          
          <button 
            onClick={() => setActiveView(SheetView.INVENTORY)}
            className={`px-4 py-1 text-xs border-r rounded-t-sm flex items-center gap-2 ${darkMode 
                ? (activeView === SheetView.INVENTORY ? 'bg-[#1e1e1e] font-semibold text-green-500 border-gray-600' : 'bg-[#333] text-gray-400 hover:bg-gray-700 border-gray-600')
                : (activeView === SheetView.INVENTORY ? 'bg-white font-semibold text-[#107C41] border-gray-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-100 border-gray-300')}`}
          >
             Inventory
          </button>
          
          <button 
             onClick={() => setActiveView(SheetView.SALES_LOG)}
             className={`px-4 py-1 text-xs border-r rounded-t-sm flex items-center gap-2 ${darkMode 
                ? (activeView === SheetView.SALES_LOG ? 'bg-[#1e1e1e] font-semibold text-green-500 border-gray-600' : 'bg-[#333] text-gray-400 hover:bg-gray-700 border-gray-600')
                : (activeView === SheetView.SALES_LOG ? 'bg-white font-semibold text-[#107C41] border-gray-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-100 border-gray-300')}`}
          >
             Sales_Log
          </button>

           <button 
             onClick={() => setActiveView(SheetView.LEDGER)}
             className={`px-4 py-1 text-xs border-r rounded-t-sm flex items-center gap-2 ${darkMode 
                ? (activeView === SheetView.LEDGER ? 'bg-[#1e1e1e] font-semibold text-green-500 border-gray-600' : 'bg-[#333] text-gray-400 hover:bg-gray-700 border-gray-600')
                : (activeView === SheetView.LEDGER ? 'bg-white font-semibold text-[#107C41] border-gray-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-100 border-gray-300')}`}
          >
             <Users size={12} />
             Party_Ledger
          </button>

           <button 
             onClick={() => setActiveView(SheetView.DASHBOARD)}
             className={`px-4 py-1 text-xs border-r rounded-t-sm flex items-center gap-2 ${darkMode 
                ? (activeView === SheetView.DASHBOARD ? 'bg-[#1e1e1e] font-semibold text-green-500 border-gray-600' : 'bg-[#333] text-gray-400 hover:bg-gray-700 border-gray-600')
                : (activeView === SheetView.DASHBOARD ? 'bg-white font-semibold text-[#107C41] border-gray-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-100 border-gray-300')}`}
          >
             Dashboard_AI
          </button>
       </div>
    </div>
  );
};

export default App;