import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft } from 'lucide-react';

interface EmailSignupScreenProps {
  onNext: (email: string) => void;
}

export function EmailSignupScreen({ onNext }: EmailSignupScreenProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onNext(email);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6 flex flex-col">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <div className="w-16 h-16 bg-[#1B998B] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#0A2463] mb-2">Welcome back</h2>
          <p className="text-gray-600">Sign in to continue your aquarium journey</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1B998B] text-white py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-[#158f7e] transition-colors"
          >
            Send Magic Link
          </button>

          <p className="text-center text-sm text-gray-500">
            No password needed — we'll email you a login link.
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
