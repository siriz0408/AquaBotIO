import { MessageSquare, Bell, ListChecks } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const valueProps = [
    {
      icon: MessageSquare,
      title: 'AI Chat Expert',
      description: 'Get instant aquarium advice',
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Never miss water changes',
    },
    {
      icon: ListChecks,
      title: 'Track Everything',
      description: 'Monitor all parameters',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#0A2463] to-[#1B998B]">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-lg">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path
                  d="M32 8C32 8 20 16 20 28C20 34.627 25.373 40 32 40C38.627 40 44 34.627 44 28C44 16 32 8 32 8Z"
                  fill="#1B998B"
                />
                <circle cx="28" cy="26" r="2" fill="white" />
                <path
                  d="M16 44C16 44 12 46 12 50C12 52.209 13.791 54 16 54C18.209 54 20 52.209 20 50C20 46 16 44 16 44Z"
                  fill="#1B998B"
                  opacity="0.7"
                />
                <path
                  d="M48 44C48 44 44 46 44 50C44 52.209 45.791 54 48 54C50.209 54 52 52.209 52 50C52 46 48 44 48 44Z"
                  fill="#1B998B"
                  opacity="0.7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Aquatic AI</h1>
          <p className="text-xl text-white/90">Your AI-powered aquarium expert</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full space-y-4"
        >
          {valueProps.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="bg-white/20 rounded-xl p-3 flex-shrink-0">
                <prop.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">{prop.title}</h3>
                <p className="text-sm text-white/80">{prop.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        onClick={onNext}
        className="w-full max-w-md bg-white text-[#0A2463] py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
      >
        Get Started
      </motion.button>
    </div>
  );
}
