import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Check, RefreshCw, Calendar, ExternalLink, Shield } from 'lucide-react';
import { Message, UserRole, MessageType, Service, TimeSlot, UserDetails, Booking } from '../types';
import { api } from '../services/mockApi';
import { llm } from '../services/llm';
import { format, addDays } from 'date-fns';

// Helper Component for OTP
const OtpInput: React.FC<{ phone: string; onSubmit: (code: string) => void }> = ({ phone, onSubmit }) => {
  const [otp, setOtp] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (otp.length < 4) return;
    setSubmitted(true);
    onSubmit(otp);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-2 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                 <Shield size={14} />
            </div>
            Enter Verification Code
        </div>
        <p className="text-xs text-gray-500">
            We sent a code to <span className="font-mono text-gray-700">{phone || 'your phone'}</span>.
        </p>
        <input 
            type="text" 
            maxLength={6}
            disabled={submitted}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center tracking-[0.5em] font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="······"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button 
            onClick={handleSubmit}
            disabled={submitted || otp.length < 4}
            className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
        >
            {submitted ? 'Verifying...' : 'Verify Code'}
        </button>
        <div className="text-center bg-blue-50 p-2 rounded-lg border border-blue-100">
             <p className="text-[11px] text-blue-600 font-medium">
                Demo Mode: Use code <span className="font-mono font-bold text-blue-800 text-sm">123456</span>
             </p>
        </div>
    </div>
  );
};

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Client-side context state to pass to LLM if needed, 
  // though we primarily rely on the conversation history and "System" injections.
  // We keep some volatile state for things that are strictly UI driven before being sent to LLM.
  const [sessionContext, setSessionContext] = useState({
    userDetails: { name: '', email: '', phone: '' } as Partial<UserDetails>,
    lastAction: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const addMessage = (msg: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: msg.role || UserRole.BOT,
      type: msg.type || MessageType.TEXT,
      content: msg.content,
      options: msg.options,
      payload: msg.payload,
      timestamp: new Date(),
      action: msg.action,
      actionPayload: msg.actionPayload
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage; // Return for immediate use
  };

  const startConversation = async () => {
    setIsTyping(true);
    // Initial handshake with LLM to get greeting
    await processLLMTurn([]); 
  };

  // Main engine: calls LLM, executes Action, updates UI, optionally loops back
  const processLLMTurn = async (currentHistory: Message[], toolContext: any = {}) => {
    setIsTyping(true);
    try {
      const llmResponse = await llm.generateBotResponse(currentHistory, toolContext);
      setIsTyping(false);

      const { response_text, action, action_payload, suggestions } = llmResponse;
      
      // Map LLM suggestions to UI options
      const options = suggestions?.map((s: string) => ({ label: s, value: s, action: 'user_reply' }));

      // 1. Render the text response first (usually)
      // Some actions might prefer to render specific UI components *instead* of just text,
      // but usually we render text + component.
      
      let messageType = MessageType.TEXT;
      let payload = null;

      // 2. Execute Backend Actions based on LLM intent
      if (action === 'show_services') {
        const services = await api.getServices();
        messageType = MessageType.SERVICE_CAROUSEL;
        payload = services;
        // We don't need to call LLM again immediately, the UI handles the next user click
      }
      else if (action === 'fetch_slots') {
        const { date, service_id } = action_payload;
        if (date && service_id) {
           const slots = await api.getAvailability(new Date(date), service_id);
           messageType = MessageType.TIME_PICKER;
           payload = slots;
           
           // If the LLM didn't return useful text (rare), fallback
           if (!response_text) {
               addMessage({ content: `Checking availability for ${date}...`, role: UserRole.BOT });
           }
        }
      }
      else if (action === 'send_otp') {
        const { phone } = action_payload;
        if (phone) {
            await api.sendOtp(phone);
            messageType = MessageType.OTP_INPUT;
            payload = { phone };
        }
      }
      else if (action === 'verify_otp') {
        const { phone, otp } = action_payload;
        const isValid = await api.verifyOtp(phone, otp);
        
        // Critical: We must inform the LLM of the result immediately so it can proceed
        // We add the system message silently to history and recurse
        const verificationMsg: Message = {
            id: Date.now().toString(),
            role: UserRole.SYSTEM,
            type: MessageType.TEXT,
            content: `OTP Verification Result: ${isValid ? 'Success' : 'Failed'}`,
            timestamp: new Date()
        };
        
        // Show the attempt feedback to user
        addMessage({ 
            content: isValid ? "Verified! ✅" : "Incorrect code. Please try again.", 
            role: UserRole.BOT 
        });

        // Loop back to LLM with updated context
        await processLLMTurn([...currentHistory, verificationMsg], { verificationStatus: isValid });
        return; // Exit this turn, the next recursion handles the response
      }
      else if (action === 'fetch_bookings') {
        const { email } = action_payload;
        const bookings = await api.getBookingsByEmail(email);
        // Feed back to LLM to generate the list text or specific cards
        await processLLMTurn(currentHistory, { bookings });
        return;
      }
      else if (action === 'create_booking') {
          // LLM has gathered all info and wants to book
          const booking = await api.createBooking(action_payload);
          messageType = MessageType.CONFIRMATION;
          payload = booking; // Show confirmation card
      }
      else if (action === 'cancel_booking') {
          const { booking_id } = action_payload;
          const success = await api.cancelBooking(booking_id);
          addMessage({ 
              content: success ? "Booking cancelled successfully." : "Failed to cancel booking. It may not exist.", 
              role: UserRole.BOT 
          });
          // Maybe loop back? Usually "Is there anything else?" is sufficient from the text response
      }
      else if (action === 'reschedule_booking') {
          const { booking_id, date, time, slot_id } = action_payload;
          // Use slot_id as time if time is missing, or vice versa depending on API contract
          // The mockApi expects time string e.g. "10:00 AM" which is what slot_id usually is in this mock
          const finalTime = time || slot_id; 
          const updatedBooking = await api.rescheduleBooking(booking_id, date, finalTime);
          
          if (updatedBooking) {
            messageType = MessageType.CONFIRMATION;
            payload = updatedBooking;
          } else {
             // If reschedule fails, tell the user
             addMessage({ content: "Failed to reschedule. The booking might not exist or the slot is taken.", role: UserRole.BOT });
          }
      }
      
      // Add the final bot message to UI
      addMessage({
          role: UserRole.BOT,
          content: response_text,
          type: messageType,
          payload: payload,
          options: options,
          action: action,
          actionPayload: action_payload
      });

    } catch (error) {
      console.error("Turn Error", error);
      setIsTyping(false);
      addMessage({ content: "Sorry, I encountered a connection error. Please try again." });
    }
  };

  const handleUserResponse = async (text: string, overrideAction?: string, overridePayload?: any) => {
      if (!text.trim() && !overrideAction) return;
      
      const userMsg = addMessage({ 
          role: UserRole.USER, 
          content: text,
          action: overrideAction,
          actionPayload: overridePayload
      });

      // Update local context if we can extract useful info (optional, helps UI state consistency)
      // For now, we rely on the LLM reading the message history.

      // Trigger LLM
      await processLLMTurn([...messages, userMsg]);
  };

  // Special UI handlers
  const handleServiceSelect = (service: Service) => {
      // Send a natural language message representing the choice
      handleUserResponse(`I would like to book ${service.name}`, 'select_service', { service_id: service.id });
  };

  const handleDateSelect = (date: string) => {
      handleUserResponse(`I pick ${format(new Date(date), 'yyyy-MM-dd')}`, 'select_date', { date });
  };

  const handleTimeSelect = (time: string) => {
      handleUserResponse(`I select the ${time} slot.`, 'select_time', { time });
  };

  // Render Helpers
  const renderServiceCarousel = (services: Service[]) => (
    <div className="flex space-x-4 overflow-x-auto pb-4 pt-2 snap-x scrollbar-hide">
      {services.map(s => (
        <div key={s.id} className="snap-center shrink-0 w-60 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <img src={s.imageUrl} alt={s.name} className="h-32 w-full object-cover" />
          <div className="p-3 flex flex-col flex-1">
            <h4 className="font-semibold text-sm text-gray-900">{s.name}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-blue-600">${s.price}</span>
              <button 
                onClick={() => handleServiceSelect(s)}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-blue-700 transition"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTimePicker = (slots: TimeSlot[]) => (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {slots.map((slot, i) => (
        <button
          key={i}
          disabled={!slot.available}
          onClick={() => handleTimeSelect(slot.time)}
          className={`py-2 px-3 text-sm rounded-lg border transition ${
            slot.available 
              ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50' 
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );

  const renderConfirmation = (booking: Booking) => (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-2">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" /> Booking Confirmed
          </h4>
          
          <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="font-semibold text-blue-900">{booking.serviceName}</div>
                  <div className="text-blue-700 mt-1 flex items-center gap-2">
                      <Calendar size={14} />
                      {format(new Date(booking.date), 'EEEE, MMMM do, yyyy')}
                  </div>
                  <div className="text-blue-700 mt-1 font-medium">
                      {booking.time}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
                  <div>
                      <span className="block text-gray-400">Patient</span>
                      <span className="font-medium text-gray-700">{booking.userDetails?.name}</span>
                  </div>
                  <div>
                      <span className="block text-gray-400">Contact</span>
                      <span className="font-medium text-gray-700">{booking.userDetails?.phone}</span>
                  </div>
                  <div className="col-span-2">
                      <span className="block text-gray-400">Email</span>
                      <span className="font-medium text-gray-700">{booking.userDetails?.email}</span>
                  </div>
              </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
             <button className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 rounded-lg transition font-medium">
                 <Calendar size={14} /> Add to Calendar
             </button>
             <button className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 rounded-lg transition font-medium">
                 <ExternalLink size={14} /> Details
             </button>
          </div>
          
          <div className="flex justify-between mt-3 px-1">
               <button 
                  onClick={() => handleUserResponse('I want to reschedule this booking')}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
               >
                   Reschedule
               </button>
               <button 
                   onClick={() => handleUserResponse('I want to cancel this booking')}
                   className="text-xs text-red-500 hover:text-red-700 underline"
               >
                   Cancel
               </button>
          </div>
      </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {/* Chat Window */}
        {isOpen && (
            <div className="pointer-events-auto bg-white w-[360px] md:w-[400px] h-[600px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up mb-4">
                {/* Header */}
                <div className="bg-blue-700 p-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-base">MedCore Assistant</h3>
                            <p className="text-xs text-blue-100 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span> Gemini Powered
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setMessages([]); startConversation(); }} className="hover:bg-white/20 p-1 rounded transition" title="Restart">
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto overflow-x-hidden">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col mb-4 ${msg.role === UserRole.USER ? 'items-end' : 'items-start'}`}>
                            {/* Message Bubble */}
                            {msg.role !== UserRole.SYSTEM && (
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                    msg.role === UserRole.USER 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                    
                                    {/* Specialized UI types inside bubble flow */}
                                    {msg.type === MessageType.SERVICE_CAROUSEL && renderServiceCarousel(msg.payload)}
                                    {msg.type === MessageType.TIME_PICKER && renderTimePicker(msg.payload)}
                                    {msg.type === MessageType.OTP_INPUT && <OtpInput phone={msg.payload?.phone} onSubmit={(code) => handleUserResponse(`OTP is ${code}`)} />}
                                    {msg.type === MessageType.CONFIRMATION && renderConfirmation(msg.payload)}
                                </div>
                            )}

                            {/* Options Buttons */}
                            {msg.options && msg.options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {msg.options.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleUserResponse(opt.value)}
                                            className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-50 transition shadow-sm"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {msg.role !== UserRole.SYSTEM && (
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {format(msg.timestamp, 'HH:mm')}
                                </span>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-center gap-1 bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none w-16 mb-4 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-3 border-t border-gray-100 flex items-center gap-2 shrink-0">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (handleUserResponse(inputValue), setInputValue(''))}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-100 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <button 
                        onClick={() => { handleUserResponse(inputValue); setInputValue(''); }}
                        disabled={!inputValue.trim()}
                        className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        )}

        {/* Toggle Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="pointer-events-auto h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all duration-300"
        >
            {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
    </div>
  );
};