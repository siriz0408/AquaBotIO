import { motion } from 'motion/react';
import { UserMessage } from './messages/UserMessage';
import { AITextMessage } from './messages/AITextMessage';
import { SpeciesCard } from './messages/SpeciesCard';
import { ParameterAlertCard } from './messages/ParameterAlertCard';
import { ActionConfirmation } from './messages/ActionConfirmation';
import { PhotoDiagnosisCard } from './messages/PhotoDiagnosisCard';

interface ChatMessagesProps {
  messages: any[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {message.type === 'user' ? (
            <UserMessage content={message.content} timestamp={message.timestamp} />
          ) : (
            <>
              {message.contentType === 'text' && (
                <AITextMessage content={message.content} timestamp={message.timestamp} />
              )}
              {message.contentType === 'species-card' && (
                <SpeciesCard data={message.content} timestamp={message.timestamp} />
              )}
              {message.contentType === 'parameter-alert' && (
                <ParameterAlertCard data={message.content} timestamp={message.timestamp} />
              )}
              {message.contentType === 'action-confirmation' && (
                <ActionConfirmation data={message.content} timestamp={message.timestamp} />
              )}
              {message.contentType === 'photo-diagnosis' && (
                <PhotoDiagnosisCard data={message.content} timestamp={message.timestamp} />
              )}
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
