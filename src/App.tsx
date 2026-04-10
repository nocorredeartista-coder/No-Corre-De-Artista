import React from 'react';
import { motion } from 'motion/react';
import { Car, User, Clock, Phone, MapPin, MessageSquare, PhoneCall, ExternalLink, X, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { calculateQuote, RideType, QuoteResult } from '@/src/lib/pricing';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { io } from 'socket.io-client';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, DirectionsRenderer } from '@react-google-maps/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: -23.5505,
  lng: -46.6333
};

function PaymentForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Ocorreu um erro ao processar o pagamento.');
    } else {
      toast.success('Pagamento realizado com sucesso!');
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
      >
        {isProcessing ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function App() {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Olá! Como posso ajudar você hoje?' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', text: chatMessage }]);
    setChatMessage('');
    
    // Mock response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Entendido! Um de nossos atendentes entrará em contato em breve.' }]);
    }, 1000);
  };

  React.useEffect(() => {
    // Test connection to Firestore if config exists
    const testConnection = async () => {
      try {
        // This will be implemented once firebase.ts is created
        console.log('Verificando conexão com o No Corre Mob...');
      } catch (error) {
        console.error('Erro de conexão:', error);
      }
    };
    testConnection();

    const timer = setTimeout(() => {
      toast("Sua consulta é amanhã!", {
        description: "Deseja agendar o transporte agora para garantir sua pontualidade?",
        action: {
          label: "Agendar",
          onClick: () => setActiveTab('schedule'),
        },
      });
    }, 10000); // Show after 10 seconds
    return () => clearTimeout(timer);
  }, []);

  const [activeTab, setActiveTab] = React.useState('home');
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [rideType, setRideType] = React.useState<RideType>('comum');
  const [rideTime, setRideTime] = React.useState('12:00');
  const [isSpecialEvent, setIsSpecialEvent] = React.useState(false);
  const [demandLevel, setDemandLevel] = React.useState<'low' | 'normal' | 'high' | 'peak'>('normal');
  const [quote, setQuote] = React.useState<QuoteResult | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [driverInfo, setDriverInfo] = React.useState<{ location: { lat: number; lng: number }; car: string; plate: string; driverName?: string } | null>(null);
  const [originAutocomplete, setOriginAutocomplete] = React.useState<google.maps.places.Autocomplete | null>(null);
  const [destAutocomplete, setDestAutocomplete] = React.useState<google.maps.places.Autocomplete | null>(null);
  const [mapCenter, setMapCenter] = React.useState(defaultCenter);
  const [originDetails, setOriginDetails] = React.useState<{ city?: string; state?: string; zip?: string; full?: string } | null>(null);
  const [destDetails, setDestDetails] = React.useState<{ city?: string; state?: string; zip?: string; full?: string } | null>(null);
  const [directions, setDirections] = React.useState<google.maps.DirectionsResult | null>(null);
  const [driverRating, setDriverRating] = React.useState(0);
  const [passengerRating, setPassengerRating] = React.useState(0);
  const [feedback, setFeedback] = React.useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  React.useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key || key === "YOUR_GOOGLE_MAPS_API_KEY") {
      toast.error("Google Maps API Key não configurada. O mapa e a busca de endereços podem não funcionar corretamente.", {
        description: "Adicione sua chave nos Segredos do AI Studio como VITE_GOOGLE_MAPS_API_KEY.",
        duration: 10000,
      });
    }
  }, []);

  const handleOriginSelect = () => {
    if (originAutocomplete) {
      const place = originAutocomplete.getPlace();
      if (place.formatted_address) {
        setOrigin(place.formatted_address);
        
        const city = place.address_components?.find(c => c.types.includes('administrative_area_level_2') || c.types.includes('locality'))?.long_name;
        const state = place.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
        const zip = place.address_components?.find(c => c.types.includes('postal_code'))?.long_name;
        
        setOriginDetails({ city, state, zip, full: place.formatted_address });
      } else if (place.name) {
        setOrigin(place.name);
      }
      
      if (place.geometry && place.geometry.location) {
        setMapCenter({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    }
  };

  const handleDestSelect = () => {
    if (destAutocomplete) {
      const place = destAutocomplete.getPlace();
      if (place.formatted_address) {
        setDestination(place.formatted_address);

        const city = place.address_components?.find(c => c.types.includes('administrative_area_level_2') || c.types.includes('locality'))?.long_name;
        const state = place.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
        const zip = place.address_components?.find(c => c.types.includes('postal_code'))?.long_name;
        
        setDestDetails({ city, state, zip, full: place.formatted_address });
      } else if (place.name) {
        setDestination(place.name);
      }

      if (place.geometry && place.geometry.location) {
        setMapCenter({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    }
  };

  const calculateRoute = React.useCallback(() => {
    if (!origin || !destination || !isLoaded) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  }, [origin, destination, isLoaded]);

  React.useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    } else {
      setDirections(null);
    }
  }, [origin, destination, calculateRoute]);

  const getCurrentLocation = (target: 'origin' | 'destination') => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    toast.info('Obtendo sua localização...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch('/api/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const data = await response.json();
          
          if (target === 'origin') {
            setOrigin(data.address);
          } else {
            setDestination(data.address);
          }
          toast.success('Localização obtida com sucesso!');
        } catch (error) {
          console.error('Reverse geocode error:', error);
          const locationStr = `${latitude},${longitude}`;
          if (target === 'origin') {
            setOrigin(locationStr);
          } else {
            setDestination(locationStr);
          }
          toast.success('Localização obtida (coordenadas)!');
        }
      },
      (error) => {
        toast.error('Não foi possível obter sua localização. Verifique as permissões.');
      }
    );
  };

  React.useEffect(() => {
    if (origin.includes(',')) {
      const [lat, lng] = origin.split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng });
      }
    } else if (destination.includes(',')) {
      const [lat, lng] = destination.split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng });
      }
    }
  }, [origin, destination]);

  React.useEffect(() => {
    const socket = io();

    socket.on('driver:location', (data) => {
      setDriverInfo(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const [isCalculating, setIsCalculating] = React.useState(false);

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setDestination(`${lat},${lng}`);
      toast.success('Destino definido pelo mapa!');
    }
  };

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      toast.error('Por favor, preencha origem e destino.');
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch('/api/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination }),
      });

      const data = await response.json();
      
      const result = calculateQuote({
        origin,
        destination,
        type: rideType,
        distanceKm: data.distanceKm,
        time: rideTime,
        isSpecialEvent,
        demandLevel,
      });

      // Override estimatedTime with real data if available
      if (!data.isSimulated) {
        result.estimatedTime = data.durationText;
      }

      setQuote(result);
      if (data.isSimulated) {
        toast.info('Cotação realizada (modo simulação).');
      } else {
        toast.success('Cotação realizada com sucesso!');
      }
    } catch (error) {
      console.error('Error calculating quote:', error);
      toast.error('Erro ao calcular cotação. Tente novamente.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511939104626', '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+5511939104626';
  };

  const startPayment = async () => {
    if (!quote) return;

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: quote.estimatedValue }),
      });

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setIsPaymentModalOpen(true);
      } else {
        toast.error('Erro ao iniciar pagamento. Verifique se o Stripe está configurado.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erro ao conectar com o servidor de pagamentos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-200">
              <Car size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">NO CORRE <span className="text-orange-600">MOB</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('home')} className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>Início</button>
            <button onClick={() => setActiveTab('quote')} className={`text-sm font-medium transition-colors ${activeTab === 'quote' ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>Cotar Viagem</button>
            <button onClick={() => setActiveTab('tracking')} className={`text-sm font-medium transition-colors ${activeTab === 'tracking' ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>Rastreamento</button>
            <button onClick={() => setActiveTab('feedback')} className={`text-sm font-medium transition-colors ${activeTab === 'feedback' ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>Avaliações</button>
          </nav>
          <Button variant="outline" className="md:hidden" size="icon">
            <Phone size={20} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* HOME TAB */}
          <TabsContent value="home" className="mt-0 space-y-8">
            <section className="text-center space-y-4 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                  Aqui não é só corrida.
                </h2>
                <p className="text-xl md:text-2xl text-slate-600 font-medium mt-4">
                  É cuidado, segurança e responsabilidade com quem você ama.
                </p>
                <p className="text-sm text-slate-400 mt-2 italic">
                  “Aqui não é só corrida. É cuidado, segurança e responsabilidade com quem você ama.”
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-14 text-lg rounded-full shadow-xl shadow-orange-200" onClick={() => setActiveTab('quote')}>
                    COTAR VIAGEM
                  </Button>
                  <Button size="lg" variant="outline" className="px-8 h-14 text-lg rounded-full border-2 border-slate-200 hover:bg-slate-50 flex flex-col items-center justify-center leading-tight" onClick={handleWhatsApp}>
                    <span>FALAR COM O NO CORRE</span>
                    <span className="text-xs text-slate-400 font-normal">(11) 93910-4626</span>
                  </Button>
                </div>
              </motion.div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                    <User size={24} />
                  </div>
                  <CardTitle>Idosos</CardTitle>
                  <CardDescription>Cuidado e paciência. Motoristas treinados para auxiliar em cada passo.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
                    <Car size={24} />
                  </div>
                  <CardTitle>Artistas</CardTitle>
                  <CardDescription>Transporte de equipamentos e logística para shows e eventos com total segurança.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                    <Clock size={24} />
                  </div>
                  <CardTitle>Recorrência</CardTitle>
                  <CardDescription>Planos mensais e agendamentos semanais para sua rotina fixa.</CardDescription>
                </CardHeader>
              </Card>
            </section>

            <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 overflow-hidden relative">
              <div className="relative z-10 space-y-6 max-w-lg">
                <h3 className="text-3xl font-bold">Preço justo e transparente</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>Corridas Padrão</span>
                    <span className="font-bold text-orange-400">R$ 4,00/km + Taxa Base</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>Artistas / Equipamentos</span>
                    <span className="font-bold text-orange-400">+ R$ 10 a R$ 30</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>Pacote Mensal (8 corridas)</span>
                    <span className="font-bold text-orange-400">R$ 280,00/mês</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pacote Mensal (12 corridas)</span>
                    <span className="font-bold text-orange-400">R$ 390,00/mês</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm italic">
                  *Garantimos lucro em corridas curtas e posicionamento como serviço organizado.
                </p>
              </div>
              <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-orange-600/20 rounded-full blur-3xl"></div>
            </section>

            <section className="space-y-6">
              <h3 className="text-2xl font-bold text-center">O que dizem nossos clientes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-none shadow-sm p-6 italic text-slate-600">
                  “O No Corre Mob foi essencial para levar minha mãe às consultas. O motorista foi super atencioso e ajudou ela com a cadeira de rodas.”
                  <p className="mt-4 not-italic font-bold text-slate-900">— Maria Silva, Filha de Idosa</p>
                </Card>
                <Card className="bg-white border-none shadow-sm p-6 italic text-slate-600">
                  “Sempre uso para levar meus equipamentos de som. Pontualidade e cuidado que não encontro em outros apps.”
                  <p className="mt-4 not-italic font-bold text-slate-900">— DJ Love Love, Artista</p>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* QUOTE TAB */}
          <TabsContent value="quote" className="mt-0">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <div className="bg-orange-600 p-6 text-white">
                <CardTitle className="text-2xl">💬 COTAR VIAGEM</CardTitle>
                <CardDescription className="text-orange-100">Preencha os dados abaixo para uma estimativa real.</CardDescription>
              </div>
              <CardContent className="p-8">
                <form onSubmit={handleQuote} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origem</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400 z-10" size={18} />
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={(autocomplete) => setOriginAutocomplete(autocomplete)}
                            onPlaceChanged={handleOriginSelect}
                            options={{ 
                              fields: ["address_components", "geometry", "formatted_address", "name"],
                              componentRestrictions: { country: "br" }
                            }}
                          >
                            <Input 
                              id="origin" 
                              placeholder="Endereço de partida e número" 
                              className="pl-10 pr-20 h-12" 
                              value={origin} 
                              onChange={(e) => setOrigin(e.target.value)} 
                            />
                          </Autocomplete>
                        ) : (
                          <Input id="origin" placeholder="Endereço de partida" className="pl-10 h-12" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                        )}
                        <div className="absolute right-1 top-1 flex gap-1 z-10">
                          {origin && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-slate-400 hover:text-slate-600"
                              onClick={() => { setOrigin(''); setOriginDetails(null); }}
                            >
                              <X size={16} />
                            </Button>
                          )}
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => getCurrentLocation('origin')}
                            title="Usar minha localização atual"
                          >
                            <MapPin size={18} />
                          </Button>
                        </div>
                      </div>
                      {originDetails && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-[11px] flex justify-between items-center shadow-sm"
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                              <MapPin size={12} className="text-orange-600" />
                              <span>{originDetails.city}{originDetails.state ? `, ${originDetails.state}` : ''}</span>
                            </div>
                            {originDetails.zip && (
                              <div className="text-slate-500 pl-4">
                                CEP: {originDetails.zip}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 text-[10px] font-bold"
                            asChild
                          >
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(originDetails.full || origin)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              VER NO MAPA <ExternalLink size={12} className="ml-1" />
                            </a>
                          </Button>
                        </motion.div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destino</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400 z-10" size={18} />
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={(autocomplete) => setDestAutocomplete(autocomplete)}
                            onPlaceChanged={handleDestSelect}
                            options={{ 
                              fields: ["address_components", "geometry", "formatted_address", "name"],
                              componentRestrictions: { country: "br" }
                            }}
                          >
                            <Input 
                              id="destination" 
                              placeholder="Digite o endereço e número (Ex: Rua Augusta, 1000)" 
                              className="pl-10 pr-20 h-12" 
                              value={destination} 
                              onChange={(e) => setDestination(e.target.value)} 
                            />
                          </Autocomplete>
                        ) : (
                          <Input id="destination" placeholder="Endereço de chegada" className="pl-10 h-12" value={destination} onChange={(e) => setDestination(e.target.value)} />
                        )}
                        <div className="absolute right-1 top-1 flex gap-1 z-10">
                          {destination && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-slate-400 hover:text-slate-600"
                              onClick={() => { setDestination(''); setDestDetails(null); }}
                            >
                              <X size={16} />
                            </Button>
                          )}
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => getCurrentLocation('destination')}
                            title="Usar minha localização atual"
                          >
                            <MapPin size={18} />
                          </Button>
                        </div>
                      </div>
                      {destDetails && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-[11px] flex justify-between items-center shadow-sm"
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                              <MapPin size={12} className="text-orange-600" />
                              <span>{destDetails.city}{destDetails.state ? `, ${destDetails.state}` : ''}</span>
                            </div>
                            {destDetails.zip && (
                              <div className="text-slate-500 pl-4">
                                CEP: {destDetails.zip}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 text-[10px] font-bold"
                            asChild
                          >
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destDetails.full || destination)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              VER NO MAPA <ExternalLink size={12} className="ml-1" />
                            </a>
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {isLoaded && (
                    <div className="space-y-2">
                      <Label>Visualize ou clique no mapa para definir o destino</Label>
                      <div className="rounded-xl overflow-hidden border border-slate-200 h-[300px] relative">
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={mapCenter}
                          zoom={13}
                          onClick={onMapClick}
                          options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            styles: [
                              {
                                featureType: "poi",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }]
                              }
                            ]
                          }}
                        >
                          {directions ? (
                            <DirectionsRenderer 
                              directions={directions}
                              options={{
                                polylineOptions: {
                                  strokeColor: "#ea580c",
                                  strokeWeight: 5,
                                  strokeOpacity: 0.8
                                },
                                markerOptions: {
                                  icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
                                }
                              }}
                            />
                          ) : (
                            <>
                              {origin.includes(',') && (
                                <Marker 
                                  position={{ lat: parseFloat(origin.split(',')[0]), lng: parseFloat(origin.split(',')[1]) }} 
                                  label="A"
                                />
                              )}
                              {destination.includes(',') && (
                                <Marker 
                                  position={{ lat: parseFloat(destination.split(',')[0]), lng: parseFloat(destination.split(',')[1]) }} 
                                  label="B"
                                />
                              )}
                            </>
                          )}
                        </GoogleMap>
                        <Button 
                          type="button"
                          variant="secondary" 
                          size="sm" 
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md text-slate-700 text-[10px] h-8"
                          onClick={() => getCurrentLocation('origin')}
                        >
                          <MapPin size={14} className="mr-1" /> Centralizar em Mim
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        * A quilometragem é calculada com base na rota real via Google Maps para garantir o valor justo.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Corrida</Label>
                      <Select value={rideType} onValueChange={(v) => setRideType(v as RideType)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comum">Comum (R$ 4/km + taxa)</SelectItem>
                          <SelectItem value="idoso">Idoso (Cuidado especial)</SelectItem>
                          <SelectItem value="artista">Artista (Equipamentos)</SelectItem>
                          <SelectItem value="equipamento">Transporte de Volume</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {rideType === 'artista' || rideType === 'equipamento' ? (
                      <div className="space-y-2">
                        <Label htmlFor="volume">Volume de Equipamento</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione o volume" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Pequeno (R$ 10 adicional)</SelectItem>
                            <SelectItem value="medium">Médio (R$ 20 adicional)</SelectItem>
                            <SelectItem value="high">Grande (R$ 30 adicional)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="time">Horário Desejado</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                          <Input id="time" type="time" className="pl-10 h-12" value={rideTime} onChange={(e) => setRideTime(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="demand">Nível de Demanda (Simulado)</Label>
                      <Select value={demandLevel} onValueChange={(v) => setDemandLevel(v as any)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione a demanda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa (Desconto)</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alta (+20%)</SelectItem>
                          <SelectItem value="peak">Pico (+50%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-100 self-end h-12">
                      <input 
                        type="checkbox" 
                        id="specialEvent" 
                        className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        checked={isSpecialEvent}
                        onChange={(e) => setIsSpecialEvent(e.target.checked)}
                      />
                      <Label htmlFor="specialEvent" className="cursor-pointer text-xs">
                        <span className="font-bold">Evento Especial?</span> (+ R$ 15,00)
                      </Label>
                    </div>
                  </div>

                  {rideType === 'idoso' && (
                    <Dialog>
                      <DialogTrigger nativeButton={false} render={
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2 cursor-pointer hover:bg-blue-100 transition-colors">
                          <p className="text-sm font-bold text-blue-700">👵 Plano Recorrente para Idosos</p>
                          <p className="text-xs text-blue-600">Deseja contratar um pacote mensal? Ex: 8 corridas/mês com preço fixo.</p>
                          <span className="text-xs font-bold text-blue-800 underline">Ver planos disponíveis</span>
                        </div>
                      } />
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Planos Mensais - No Corre Mob</DialogTitle>
                          <DialogDescription>Economize com nossos pacotes recorrentes para idosos.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Card className="p-4 border-2 border-blue-100 hover:border-blue-600 cursor-pointer transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">Plano Essencial</p>
                                <p className="text-xs text-slate-500">8 corridas por mês</p>
                              </div>
                              <p className="text-xl font-bold text-blue-600">R$ 280</p>
                            </div>
                          </Card>
                          <Card className="p-4 border-2 border-blue-100 hover:border-blue-600 cursor-pointer transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">Plano Premium</p>
                                <p className="text-xs text-slate-500">12 corridas por mês</p>
                              </div>
                              <p className="text-xl font-bold text-blue-600">R$ 390</p>
                            </div>
                          </Card>
                        </div>
                        <DialogFooter>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => toast.success('Interesse registrado! Entraremos em contato.')}>
                            TENHO INTERESSE
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="obs">Observações</Label>
                    <Input id="obs" placeholder="Ex: Precisa de ajuda com escada, volume extra..." className="h-12" />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isCalculating}
                    className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-100"
                  >
                    {isCalculating ? 'CALCULANDO...' : 'CALCULAR ESTIMATIVA'}
                  </Button>
                </form>

                {quote && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 rounded-2xl bg-orange-50 border border-orange-100 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-orange-600 font-bold uppercase tracking-wider">Valor Estimado</p>
                        <p className="text-4xl font-extrabold text-slate-900">R$ {quote.estimatedValue.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-orange-600 font-bold uppercase tracking-wider">Tempo Chegada</p>
                        <p className="text-2xl font-bold text-slate-900">{quote.estimatedTime}</p>
                      </div>
                    </div>

                    <div className="bg-white/50 rounded-xl p-4 space-y-2 text-sm border border-orange-100">
                      <p className="font-bold text-slate-700 mb-2">Detalhamento do Preço:</p>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Distância Total:</span>
                        <span className="font-bold text-slate-900">{quote.distanceKm.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Taxa Base (Demanda):</span>
                        <span className="font-medium">R$ {quote.breakdown.base.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Distância Percorrida:</span>
                        <span className="font-medium">R$ {quote.breakdown.distance.toFixed(2)}</span>
                      </div>
                      {quote.breakdown.surcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Adicional de Serviço:</span>
                          <span className="font-medium">R$ {quote.breakdown.surcharge.toFixed(2)}</span>
                        </div>
                      )}
                      {quote.breakdown.peakAdjustment > 0 && (
                        <div className="flex justify-between text-orange-600 font-bold">
                          <span>Ajuste de Pico / Evento:</span>
                          <span>+ R$ {quote.breakdown.peakAdjustment.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Button className="h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl" onClick={startPayment}>
                        PAGAR E CONFIRMAR AGORA
                      </Button>
                      <Button variant="outline" className="h-12 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl flex flex-col items-center justify-center leading-tight" onClick={handleWhatsApp}>
                        <span>FALAR COM ATENDIMENTO</span>
                        <span className="text-xs text-orange-400 font-normal">(11) 93910-4626</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRACKING TAB */}
          <TabsContent value="tracking" className="mt-0">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-900 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <MapPin size={24} className="text-orange-500" /> RASTREAMENTO WHATSAPP
                    </CardTitle>
                    <CardDescription className="text-slate-400">Localização sincronizada em tempo real via WhatsApp.</CardDescription>
                  </div>
                  <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    WHATSAPP CONECTADO
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={driverInfo?.location || defaultCenter}
                      zoom={15}
                    >
                      {driverInfo && (
                        <Marker 
                          position={driverInfo.location} 
                          label={{
                            text: "HB20",
                            className: "bg-white px-2 py-1 rounded shadow-sm font-bold text-xs border border-slate-200"
                          }}
                        />
                      )}
                    </GoogleMap>
                  ) : (
                    <div className="h-[400px] bg-slate-100 flex items-center justify-center text-slate-400">
                      Carregando mapa...
                    </div>
                  )}
                  
                  {driverInfo && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                          <Car size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{driverInfo.car}</p>
                          <p className="text-xs text-slate-500">Placa: {driverInfo.plate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1 justify-end">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> AO VIVO
                        </p>
                        <p className="text-xs text-slate-400">Via WhatsApp</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <ExternalLink size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Sincronização Ativa</p>
                        <p className="text-xs text-slate-500">O motorista está compartilhando a localização fixa no WhatsApp.</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 px-6 font-bold flex items-center gap-2"
                      onClick={handleWhatsApp}
                    >
                      <MessageSquare size={18} /> PEDIR NOVA LOCALIZAÇÃO
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="h-10 w-10 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{driverInfo?.driverName?.split(' ')[0] || "Juan"}</p>
                      <p className="text-xs text-slate-600 font-medium">Uber • +1000 avaliações 5 estrelas</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-700">Antirracismo</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-700">Segurança da Mulher</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-700">Cuidado com Idosos/Crianças</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto rounded-full border-orange-200 text-orange-600 flex flex-col h-auto py-1 px-3" onClick={handleCall}>
                      <div className="flex items-center">
                        <Phone size={14} className="mr-1" /> Ligar
                      </div>
                      <span className="text-[10px] font-normal">(11) 93910-4626</span>
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 italic px-2">
                    * O rastreamento é atualizado automaticamente conforme o motorista envia a localização em tempo real no grupo/conversa do WhatsApp.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback" className="mt-0 space-y-6">
            <Card className="border-none shadow-xl bg-white">
              <CardHeader className="bg-orange-600 text-white rounded-t-xl">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Star size={24} /> AVALIAÇÕES E FEEDBACK
                </CardTitle>
                <CardDescription className="text-orange-100">Sua opinião é fundamental para mantermos a qualidade.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Rate Driver */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden border-2 border-orange-200">
                        <img 
                          src="https://picsum.photos/seed/driver-juan/200" 
                          alt="Juan" 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">Avaliar Juan</h4>
                        <p className="text-sm text-slate-500">Motorista Parceiro</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sua nota para o motorista</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            onClick={() => setDriverRating(star)}
                            className={`p-1 transition-transform hover:scale-110 ${driverRating >= star ? 'text-yellow-400' : 'text-slate-200'}`}
                          >
                            <Star size={32} fill={driverRating >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Seu comentário</Label>
                      <textarea 
                        className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                        placeholder="Como foi sua experiência com o Juan?"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>

                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 rounded-xl font-bold"
                      onClick={() => {
                        toast.success('Obrigado pelo seu feedback!');
                        setFeedback('');
                        setDriverRating(0);
                      }}
                    >
                      ENVIAR AVALIAÇÃO
                    </Button>
                  </div>

                  {/* Driver Rates Passenger (Simulated for Demo) */}
                  <div className="space-y-6 border-l md:pl-12 border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-slate-200">
                        <User size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">Registro de Passageiros</h4>
                        <p className="text-sm text-slate-500">Avaliação do Motorista</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Últimos Passageiros</p>
                      
                      {[
                        { name: 'Maria', rating: 5, photo: 'https://picsum.photos/seed/maria/100' },
                        { name: 'João', rating: 4, photo: 'https://picsum.photos/seed/joao/100' },
                        { name: 'Ana', rating: 5, photo: 'https://picsum.photos/seed/ana/100' }
                      ].map((passenger, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                          <div className="flex items-center gap-3">
                            <img 
                              src={passenger.photo} 
                              alt={passenger.name} 
                              className="h-10 w-10 rounded-full object-cover border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-bold text-slate-700">{passenger.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold text-slate-900">{passenger.rating}.0</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <p className="text-xs text-orange-800 leading-relaxed">
                        <strong>Nota do Motorista:</strong> Juan também avalia os passageiros para manter a segurança e o respeito mútuo em nossa comunidade.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pagamento Seguro</DialogTitle>
            <DialogDescription>
              Finalize o pagamento da sua corrida de R$ {quote?.estimatedValue.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  amount={quote?.estimatedValue || 0} 
                  onSuccess={() => {
                    setIsPaymentModalOpen(false);
                    toast.success('Corrida confirmada! Motorista a caminho.');
                  }} 
                />
              </Elements>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Contact Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 items-end">
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogTrigger nativeButton={false} render={
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <span className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-orange-600 border border-orange-100 hidden md:block">Conversar</span>
              <Button 
                className="h-16 w-16 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-2xl shadow-orange-200 flex items-center justify-center p-0"
              >
                <MessageSquare size={28} />
              </Button>
            </motion.div>
          } />
          <DialogContent className="sm:max-w-[425px] h-[500px] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-orange-600 text-white">
              <DialogTitle>Chat No Corre</DialogTitle>
              <DialogDescription className="text-orange-100">
                Estamos aqui para ajudar você. <br />
                WhatsApp: <span className="font-bold">+55 11 93910-4626</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              <div className="flex justify-center mb-4">
                <Button 
                  variant="outline" 
                  className="bg-white text-green-600 border-green-200 hover:bg-green-50 rounded-full"
                  onClick={handleWhatsApp}
                >
                  <ExternalLink size={16} className="mr-2" /> Conversar via WhatsApp
                </Button>
              </div>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-slate-900 shadow-sm rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Digite sua mensagem..." 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-orange-600 hover:bg-orange-700">
                  <MessageSquare size={18} />
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2"
        >
          <span className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-green-600 border border-green-100 hidden md:block">WhatsApp (11) 93910-4626</span>
          <Button 
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-2xl shadow-green-200 flex items-center justify-center p-0"
            onClick={handleWhatsApp}
          >
            <ExternalLink size={28} />
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2"
        >
          <span className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-slate-600 border border-slate-100 hidden md:block">Ligar</span>
          <Button 
            className="h-16 w-16 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 flex items-center justify-center p-0"
            onClick={handleCall}
          >
            <PhoneCall size={28} />
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Car size={18} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">NO CORRE MOB</h2>
          </div>
          <p className="text-slate-400 max-w-md mx-auto">
            Infraestrutura, recorrência e impacto social. Mobilidade urbana com propósito.
          </p>
          <div className="flex justify-center gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Trabalhe Conosco</a>
          </div>
          <p className="text-slate-600 text-xs pt-8">
            © 2026 No Corre Mob. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
