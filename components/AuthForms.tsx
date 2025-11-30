
import React, { useState } from 'react';
import { User, AuthStep } from '../types';
import { X, ShieldCheck, LogIn, UserPlus, KeyRound, Lock, Copy } from 'lucide-react';

interface AuthFormsProps {
  authStep: AuthStep;
  onCreatorCheck: (password: string) => void;
  onLogin: (userId: string, pass: string) => void;
  onSignup: (user: User) => void;
  onSwitchToSignup: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRecovery: () => void;
  onAdminVerify?: (password: string) => boolean;
  users?: User[];
  darkMode?: boolean;
  systemID?: string;
}

export const AuthForms: React.FC<AuthFormsProps> = ({
  authStep,
  onCreatorCheck, // This now acts as "onActivation" in the first step
  onLogin,
  onSignup,
  onSwitchToSignup,
  onSwitchToLogin,
  onSwitchToRecovery,
  onAdminVerify,
  users = [],
  darkMode = false,
  systemID = 'LOADING...'
}) => {
  // Activation / Creator Check State
  const [activationKey, setActivationKey] = useState('');
  const [secretClickCount, setSecretClickCount] = useState(0);

  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Signup State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupId, setSignupId] = useState('');
  const [signupPass, setSignupPass] = useState('');

  // Recovery State
  const [recoveryPass, setRecoveryPass] = useState('');
  const [isRecoveryVerified, setIsRecoveryVerified] = useState(false);

  const [error, setError] = useState('');

  // Styling (Reused from VBA Theme)
  const windowClass = darkMode ? 'bg-[#333] border-gray-600' : 'bg-[#f0f0f0] vba-window';
  const inputClass = darkMode 
    ? 'w-full px-1 py-1 outline-none focus:bg-blue-900 bg-[#1a1a1a] text-white border border-gray-600'
    : 'w-full vba-inset px-1 py-1 outline-none focus:bg-yellow-50';
  const labelClass = darkMode ? 'text-gray-300' : 'text-black';
  const buttonClass = darkMode 
    ? 'bg-[#444] text-gray-200 border border-gray-500 hover:bg-[#555] active:bg-[#333]'
    : 'vba-button active:translate-y-px';

  // Handlers
  const handleActivationSubmit = () => {
    setError('');
    if (!activationKey) { setError('Key Required'); return; }
    onCreatorCheck(activationKey);
  };

  const handleSecretClick = () => {
    const newCount = secretClickCount + 1;
    setSecretClickCount(newCount);
    
    if (newCount === 5) {
        const pass = prompt("Owner Override: Enter Master Password");
        if (pass === "RealKingOne1") {
            // Auto-generate key for the owner
            const generatedKey = btoa(systemID + "RealKingOne1");
            setActivationKey(generatedKey);
            alert(`Key Generated:\n${generatedKey}\n\nClick 'Unlock Application' to proceed.`);
        } else {
            alert("Access Denied");
        }
        setSecretClickCount(0);
    }
  };

  const handleLoginSubmit = () => {
    setError('');
    if (!loginId || !loginPass) { setError('Enter credentials'); return; }
    onLogin(loginId, loginPass);
  };

  const handleSignupSubmit = () => {
    setError('');
    
    // Regex Validations
    const userIdRegex = /^[a-zA-Z0-9!@#$%^&*]{5,12}$/;
    const passRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,12}$/;

    if (!firstName || !lastName) { setError('Name required'); return; }
    if (!userIdRegex.test(signupId)) { setError('Invalid User ID Format'); return; }
    if (!passRegex.test(signupPass)) { setError('Invalid Password Format'); return; }

    onSignup({
        firstName,
        lastName,
        userId: signupId,
        password: signupPass
    });
  };

  const handleRecoverySubmit = () => {
    setError('');
    if (!onAdminVerify) return;
    if (onAdminVerify(recoveryPass)) {
        setIsRecoveryVerified(true);
    } else {
        setError("Invalid Admin Password");
    }
  };

  const copyToClipboard = () => {
      if(systemID) {
          navigator.clipboard.writeText(systemID);
          alert("System ID copied to clipboard!");
      }
  };

  if (authStep === 'APP') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-[450px] shadow-2xl ${windowClass}`}>
        
        {/* Title Bar */}
        <div className={`px-2 py-1 flex justify-between items-center select-none ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-[#000080] to-[#1084d0]'}`}>
            <span className="font-bold text-white text-xs">
                {authStep === 'CREATOR_CHECK' && "Software Activation & Licensing"}
                {authStep === 'LOGIN' && "UserForm3 - User Login"}
                {authStep === 'SIGNUP' && "UserForm4 - New User Registration"}
                {authStep === 'RECOVERY' && "Admin Panel - User Recovery"}
            </span>
            <div className={`w-4 h-4 flex items-center justify-center border text-[10px] leading-none pb-1 cursor-default ${darkMode ? 'bg-[#444] text-white border-gray-600' : 'bg-[#f0f0f0] text-black border-gray-400'}`}>
                <X size={10} />
            </div>
        </div>

        {/* Content */}
        <div className="p-6">
            
            {/* ACTIVATION VIEW (Replaces Creator Check) */}
            {authStep === 'CREATOR_CHECK' && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 text-sm text-gray-500 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div onClick={handleSecretClick} className="cursor-pointer active:scale-95 transition-transform" title="Double click for options">
                             <ShieldCheck size={40} className="text-orange-500 flex-shrink-0 mt-1" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 mb-1">Application Locked</p>
                            <p className="text-xs">This software is locked to this hardware. Provide the System ID below to the vendor (Aseem Khan) to receive your Activation Key.</p>
                            <p className="text-xs mt-1 font-bold">Contact: 0345‑0900064</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className={`text-xs block mb-1 font-bold ${labelClass}`}>Your System ID:</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className={`flex-1 font-mono text-center font-bold tracking-wider bg-gray-200 text-gray-600 border border-gray-400 px-2 py-1 select-all ${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : ''}`}
                                value={systemID}
                                readOnly
                            />
                            <button onClick={copyToClipboard} className={`${buttonClass} px-2`} title="Copy ID">
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <label className={`text-xs block mb-1 ${labelClass}`}>Enter Activation Key:</label>
                        <input 
                            type="text" 
                            className={inputClass} 
                            placeholder="Paste your key here..."
                            value={activationKey}
                            onChange={(e) => setActivationKey(e.target.value)}
                        />
                    </div>
                    <button onClick={handleActivationSubmit} className={`${buttonClass} px-4 py-2 mt-2 font-bold bg-blue-50 text-blue-800`}>Unlock Application</button>
                </div>
            )}

            {/* LOGIN VIEW */}
            {authStep === 'LOGIN' && (
                <div className="flex flex-col gap-4">
                    <div className="text-center mb-2">
                        <LogIn size={32} className="mx-auto text-blue-600 mb-2" />
                        <h2 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Sign In</h2>
                    </div>
                    <div>
                        <label className={`text-xs block mb-1 ${labelClass}`}>User ID:</label>
                        <input 
                            type="text" 
                            className={inputClass}
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={`text-xs block mb-1 ${labelClass}`}>Password:</label>
                        <input 
                            type="password" 
                            className={inputClass}
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                        />
                        <div className="text-right mt-1">
                            <span 
                                className="text-[10px] text-blue-500 cursor-pointer hover:underline"
                                onClick={() => {
                                    setIsRecoveryVerified(false);
                                    setRecoveryPass('');
                                    onSwitchToRecovery();
                                }}
                            >
                                Forgot Password?
                            </span>
                        </div>
                    </div>
                    <button onClick={handleLoginSubmit} className={`${buttonClass} px-4 py-2 mt-2 font-bold`}>Login</button>
                    <div className="text-center mt-2">
                        <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={onSwitchToSignup}>
                            New User? Create Account
                        </span>
                    </div>
                </div>
            )}

            {/* SIGNUP VIEW */}
            {authStep === 'SIGNUP' && (
                <div className="flex flex-col gap-3">
                     <div className="text-center mb-1">
                        <UserPlus size={24} className="mx-auto text-green-600 mb-1" />
                        <h2 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Register</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={`text-xs block mb-1 ${labelClass}`}>First Name:</label>
                            <input type="text" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div>
                            <label className={`text-xs block mb-1 ${labelClass}`}>Last Name:</label>
                            <input type="text" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className={`text-xs block mb-1 ${labelClass}`}>User ID (5-12 chars, alphanumeric, special):</label>
                        <input type="text" className={inputClass} value={signupId} onChange={(e) => setSignupId(e.target.value)} />
                    </div>
                    <div>
                        <label className={`text-xs block mb-1 ${labelClass}`}>Password (5-12 chars, 1 Upper, 1 Num, 1 Spec):</label>
                        <input type="password" className={inputClass} value={signupPass} onChange={(e) => setSignupPass(e.target.value)} />
                    </div>
                    <button onClick={handleSignupSubmit} className={`${buttonClass} px-4 py-2 mt-2 font-bold`}>Sign Up</button>
                     <div className="text-center mt-1">
                        <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={onSwitchToLogin}>
                            Back to Login
                        </span>
                    </div>
                </div>
            )}

            {/* RECOVERY VIEW */}
            {authStep === 'RECOVERY' && (
                <div className="flex flex-col gap-3">
                     <div className="text-center mb-1">
                        <Lock size={24} className="mx-auto text-red-600 mb-1" />
                        <h2 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Admin Account Recovery</h2>
                        <p className="text-[10px] text-gray-500">Ask the Store Owner to enter the Master Password.</p>
                    </div>
                    
                    {!isRecoveryVerified ? (
                        <>
                             <div>
                                <label className={`text-xs block mb-1 ${labelClass}`}>Admin Master Password:</label>
                                <input 
                                    type="password" 
                                    className={inputClass} 
                                    value={recoveryPass} 
                                    onChange={(e) => setRecoveryPass(e.target.value)} 
                                />
                            </div>
                            <button onClick={handleRecoverySubmit} className={`${buttonClass} px-4 py-2 mt-2 font-bold`}>Verify Admin</button>
                        </>
                    ) : (
                        <div className="mt-2">
                            <h3 className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Registered Users Database:</h3>
                            <div className={`max-h-40 overflow-y-auto border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                <table className="w-full text-[10px]">
                                    <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                        <tr>
                                            <th className="p-1 text-left">Name</th>
                                            <th className="p-1 text-left">User ID</th>
                                            <th className="p-1 text-left">Password</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        {users.map((u, i) => (
                                            <tr key={i} className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                                                <td className="p-1">{u.firstName} {u.lastName}</td>
                                                <td className="p-1 font-mono">{u.userId}</td>
                                                <td className="p-1 font-mono bg-yellow-100 text-black px-1">{u.password}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 italic">Note: Provide the employee with their credentials.</p>
                        </div>
                    )}
                    
                     <div className="text-center mt-2 border-t pt-2">
                        <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={onSwitchToLogin}>
                            Back to Login Screen
                        </span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 text-xs text-center">
                    Error: {error}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
