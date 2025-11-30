import React, { useState } from 'react';
import { ChatWidget } from './components/ChatWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { Stethoscope, ShieldCheck, Clock, Star } from 'lucide-react';

const App: React.FC = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <Stethoscope className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">MedCore Health</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition hidden md:block">Services</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition hidden md:block">Doctors</a>
            <button 
                onClick={() => setShowAdmin(true)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-800 uppercase tracking-wider border border-gray-200 px-3 py-1 rounded-md transition"
            >
                Admin Login
            </button>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                Patient Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                    <Star size={14} className="fill-blue-700" />
                    <span>Rated #1 Clinic in the City</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                    Healthcare that <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                        revolves around you.
                    </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                    Experience modern consultation services with top-tier specialists. 
                    Book your appointment in seconds via our AI assistant.
                </p>
                
                <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-green-500" /> HIPAA Compliant
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="text-blue-500" /> 24/7 Booking
                    </div>
                </div>
            </div>
            
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-teal-100 rounded-full blur-3xl opacity-50"></div>
                <img 
                    src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    alt="Doctor Consultation" 
                    className="relative rounded-3xl shadow-2xl border-4 border-white object-cover h-[500px] w-full"
                />
                
                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce duration-[3000ms]">
                    <div className="bg-green-100 p-3 rounded-full">
                        <Stethoscope className="text-green-600" size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Doctors Online</p>
                        <p className="text-lg font-bold text-gray-900">12 Available</p>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-gray-900">Why Choose MedCore?</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                  {[
                      { title: "Expert Specialists", desc: "Board-certified doctors across 20+ specialties." },
                      { title: "Instant Booking", desc: "No phone calls needed. Book directly through our chat." },
                      { title: "Digital Records", desc: "Access your medical history securely from anywhere." }
                  ].map((item, i) => (
                      <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                          <p className="text-gray-600">{item.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;
