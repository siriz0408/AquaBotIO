import { motion } from 'motion/react';
import { Mail } from 'lucide-react';

interface CheckEmailScreenProps {
  email: string;
  onNext: () => void;
  onResend: () => void;
}

export function CheckEmailScreen({ email, onNext, onResend }: CheckEmailScreenProps) {
  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg"
        >
          <Mail className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-[#0A2463] mb-4"
        >
          Check your email
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <p className="text-gray-600 mb-2">We sent a login link to</p>
          <p className="font-semibold text-[#0A2463]">{email}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <button
            onClick={onResend}
            className="text-[#1B998B] font-semibold hover:underline"
          >
            Resend link
          </button>

          <div className="pt-4">
            <button
              onClick={onNext}
              className="w-full bg-[#1B998B] text-white py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-[#158f7e] transition-colors"
            >
              Continue to Demo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
