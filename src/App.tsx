import React from 'react';
import { motion } from 'motion/react';
import { Car, User, Clock, Phone, MapPin, MessageSquare, PhoneCall, ExternalLink, X, Star, ThumbsUp, ThumbsDown, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
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
  const [rideType, setRideType] = React.useState<string>('comum');
  const [rideTime, setRideTime] = React.useState('');
  const [isSpecialEvent, setIsSpecialEvent] = React.useState('nao');
  const [observations, setObservations] = React.useState('');
  const [driverInfo, setDriverInfo] = React.useState<{ location: { lat: number; lng: number }; car: string; plate: string; driverName?: string } | null>(null);
  const [driverRating, setDriverRating] = React.useState(0);
  const [passengerRating, setPassengerRating] = React.useState(0);
  const [passengerName, setPassengerName] = React.useState('');
  const [passengerRatings, setPassengerRatings] = React.useState<{ name: string; rating: number; photo: string }[]>([
    { name: 'Maria', rating: 5, photo: 'https://picsum.photos/seed/maria/100' },
    { name: 'João', rating: 4, photo: 'https://picsum.photos/seed/joao/100' },
    { name: 'Ana', rating: 5, photo: 'https://picsum.photos/seed/ana/100' }
  ]);
  const [feedback, setFeedback] = React.useState('');

  const handleQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !rideType || !rideTime) {
      toast.error('Por favor, preencha os campos obrigatórios: Origem, Destino, Tipo de Corrida e Horário.');
      return;
    }

    const rideTypeLabels: Record<string, string> = {
      'comum': 'Corrida comum',
      'idoso': 'Idoso com cuidado específico',
      'artista': 'Artista com equipamento',
      'volume': 'Transporte de volume'
    };

    const message = `Olá, quero cotar uma viagem no No Corre Mob.

Origem: ${origin}
Destino: ${destination}
Tipo de corrida: ${rideTypeLabels[rideType] || rideType}
Horário desejado: ${rideTime}
Evento especial: ${isSpecialEvent === 'sim' ? 'Sim' : 'Não'}
Observações: ${observations || 'Nenhuma'}

Gostaria de receber uma estimativa.`;

    const whatsappUrl = `https://wa.me/5511939104626?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Redirecionando para o WhatsApp...');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511939104626', '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+5511939104626';
  };

  const startPayment = async () => {
    // Payment functionality disabled or simplified as per request
    toast.info('Funcionalidade de pagamento em desenvolvimento.');
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
              <div className="bg-orange-600 p-6 text-white text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <MessageSquare size={24} /> COTAR VIAGEM
                </CardTitle>
                <CardDescription className="text-orange-100">Preencha os dados e receba sua estimativa via WhatsApp.</CardDescription>
              </div>
              <CardContent className="p-8">
                <form onSubmit={handleQuote} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="origin" className="font-bold">Endereço de Origem *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <Input 
                          id="origin" 
                          placeholder="Ex: Rua Augusta, 1000 - São Paulo" 
                          className="pl-10 h-12 rounded-xl border-slate-200 focus:border-orange-500" 
                          value={origin} 
                          onChange={(e) => setOrigin(e.target.value)} 
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination" className="font-bold">Endereço de Destino *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <Input 
                          id="destination" 
                          placeholder="Ex: Av. Paulista, 1500 - São Paulo" 
                          className="pl-10 h-12 rounded-xl border-slate-200 focus:border-orange-500" 
                          value={destination} 
                          onChange={(e) => setDestination(e.target.value)} 
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="font-bold">Tipo de Corrida *</Label>
                      <Select value={rideType} onValueChange={setRideType}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comum">Corrida comum</SelectItem>
                          <SelectItem value="idoso">Idoso com cuidado específico</SelectItem>
                          <SelectItem value="artista">Artista com equipamento</SelectItem>
                          <SelectItem value="volume">Transporte de volume</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="font-bold">Horário Desejado *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <Input 
                          id="time" 
                          type="time" 
                          className="pl-10 h-12 rounded-xl border-slate-200" 
                          value={rideTime} 
                          onChange={(e) => setRideTime(e.target.value)} 
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="specialEvent" className="font-bold">Evento Especial? *</Label>
                      <Select value={isSpecialEvent} onValueChange={setIsSpecialEvent}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="obs" className="font-bold">Observações</Label>
                      <Textarea 
                        id="obs" 
                        placeholder="Ex: Precisa de ajuda com escada, volume extra..." 
                        className="min-h-[48px] rounded-xl border-slate-200" 
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 font-bold"
                    >
                      <Send size={20} /> CALCULAR ESTIMATIVA
                    </Button>
                  </div>
                  
                  <p className="text-center text-xs text-slate-400 mt-4">
                    Ao clicar, você será redirecionado para o nosso WhatsApp oficial para receber o orçamento.
                  </p>
                </form>
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
                  <div className="h-[300px] bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-8 text-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <MapPin size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-600">
                        Rastreamento via WhatsApp Ativo
                      </p>
                      <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                        Para sua segurança, o motorista compartilha a localização em tempo real diretamente no chat do WhatsApp.
                      </p>
                    </div>
                  </div>
                  
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
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-10 w-10 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 overflow-hidden border border-orange-200 shadow-sm"
                    >
                      <Car size={20} />
                    </motion.div>
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
                  <div className="relative overflow-hidden rounded-2xl p-6 border border-slate-100 bg-white shadow-sm">
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.05, 1],
                            boxShadow: ["0px 0px 0px rgba(234, 88, 12, 0)", "0px 0px 20px rgba(234, 88, 12, 0.3)", "0px 0px 0px rgba(234, 88, 12, 0)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden border-4 border-orange-500 shadow-lg relative"
                        >
                          <Car size={40} />
                        </motion.div>
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
                </div>

                {/* Driver Rates Passenger */}
                  <div className="space-y-6 border-l md:pl-12 border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-slate-200">
                        <User size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">Avaliar Passageiro</h4>
                        <p className="text-sm text-slate-500">Área Exclusiva do Motorista</p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-2">
                        <Label htmlFor="passengerName">Nome do Passageiro</Label>
                        <Input 
                          id="passengerName"
                          placeholder="Ex: Carlos"
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nota para o passageiro</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star}
                              onClick={() => setPassengerRating(star)}
                              className={`p-1 transition-transform hover:scale-110 ${passengerRating >= star ? 'text-yellow-400' : 'text-slate-200'}`}
                            >
                              <Star size={24} fill={passengerRating >= star ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10 rounded-xl font-bold text-xs"
                        disabled={!passengerName || passengerRating === 0}
                        onClick={() => {
                          const newRating = {
                            name: passengerName,
                            rating: passengerRating,
                            photo: `https://picsum.photos/seed/${passengerName.toLowerCase()}/100`
                          };
                          setPassengerRatings([newRating, ...passengerRatings]);
                          toast.success(`Avaliação de ${passengerName} salva com sucesso!`);
                          setPassengerName('');
                          setPassengerRating(0);
                        }}
                      >
                        SALVAR AVALIAÇÃO PRIVADA
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico Privado de Avaliações</p>
                      
                      {passengerRatings.map((passenger, i) => (
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
