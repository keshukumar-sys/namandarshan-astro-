// import Header from "@/components/layout/Header";
// import Footer from "@/components/layout/Footer";

// const Wallet = () => {
//   return (
//     <div className="min-h-screen bg-gray-100">
//       <Header />

//       <div className="container mx-auto px-5 pt-44 pb-10">
//         <div className="max-w-3xl mx-auto">

//           <div className="bg-white rounded-xl shadow border p-8">

//             <h1 className="text-3xl font-bold mb-6">
//               My Wallet
//             </h1>

//             <div className="bg-green-50 border rounded-xl p-6 mb-6">
//               <p className="text-gray-500">
//                 Available Balance
//               </p>

//               <h2 className="text-4xl font-bold text-green-600">
//                 ₹500
//               </h2>
//             </div>

//             <h3 className="font-semibold mb-4">
//               Recharge Wallet
//             </h3>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

//               <button className="border rounded-xl py-4 hover:bg-orange-50">
//                 ₹100
//               </button>

//               <button className="border rounded-xl py-4 hover:bg-orange-50">
//                 ₹200
//               </button>

//               <button className="border rounded-xl py-4 hover:bg-orange-50">
//                 ₹500
//               </button>

//               <button className="border rounded-xl py-4 hover:bg-orange-50">
//                 ₹1000
//               </button>

//             </div>

//             <button
//               className="w-full mt-6 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
//             >
//               Proceed To Payment
//             </button>

//           </div>

//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default Wallet;


import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RechargeModal from "@/components/astrologer/RechargeModal";
import { useWallet } from "@/context/WalletContext";
import { Loader2 } from "lucide-react";

const Wallet = () => {
  const { balance, isLoading } = useWallet();
  const [showRecharge, setShowRecharge] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="container mx-auto px-5 pt-44 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow border p-8">
            <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

            <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-6 mb-6 shadow-xs">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Available Balance</p>

              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mt-3" />
              ) : (
                <div className="mt-2 flex items-center gap-2 text-emerald-600">
                  <span className="text-3xl font-extrabold font-sans">₹</span>
                  <span className="text-4xl font-black font-sans tracking-tight">
                    {Number(balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <h3 className="font-semibold mb-4">Recharge Wallet</h3>

            <button
              onClick={() => setShowRecharge(true)}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
            >
              Add Money
            </button>
          </div>
        </div>
      </div>

      {showRecharge && <RechargeModal onClose={() => setShowRecharge(false)} />}

      <Footer />
    </div>
  );
};

export default Wallet;
