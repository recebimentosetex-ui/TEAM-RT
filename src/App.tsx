/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  useState, 
  useEffect, 
  useMemo, 
  type Dispatch, 
  type SetStateAction, 
  type ReactNode, 
  type FormEvent
} from 'react';
import { 
  Users, 
  DollarSign, 
  Trophy, 
  Plus, 
  Trash2, 
  History, 
  Calendar, 
  TrendingUp,
  LayoutDashboard,
  Settings,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Clock,
  Lock,
  LogOut,
  KeyRound,
  Target,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  getDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from './lib/utils';
import { 
  Athlete, 
  Category, 
  DEFAULT_CATEGORIES, 
  PaymentStatus, 
  EVALUATION_LABELS,
  EvaluationMetrics,
  CategoryId,
  TrainingSession,
  User,
  UserRole
} from './types';

// --- Utility: ID Generation ---
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
};

// --- LocalStorage Hook ---
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('LocalStorage Read Error:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('LocalStorage Write Error:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// --- App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('atletapro_user', null);
  const [users, setUsers] = useLocalStorage<User[]>('atletapro_users', [
    { id: '1', username: 'RoitherH2026', name: 'Roither Admin', role: 'ADMIN', password: 'admin' }
  ]);
  const [activeTab, setActiveTab] = useState<'CONTABIL' | 'CADASTRO' | 'CATEGORIAS' | 'AGENDA' | 'METAS' | 'USUARIOS'>('CADASTRO');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [athletes, setAthletes] = useLocalStorage<Athlete[]>('atletapro_athletes', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('atletapro_categories', DEFAULT_CATEGORIES);
  const [payments, setPayments] = useLocalStorage<PaymentStatus>('atletapro_payments', {});
  const [trainingSessions, setTrainingSessions] = useLocalStorage<TrainingSession[]>('atletapro_training', []);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);

  // --- Handlers ---
  const addAthlete = (athlete: Omit<Athlete, 'id' | 'observations' | 'evaluation'>) => {
    const newAthlete: Athlete = {
      ...athlete,
      id: generateId(),
      observations: [
        { id: generateId(), text: 'Atleta cadastrado no sistema.', date: new Date().toISOString() }
      ],
      evaluation: {
        chapa: 0, peito: 0, ombro: 0, defesa: 0, ataque: 0, recepcao: 0, levantamento: 0
      }
    };
    setAthletes([...athletes, newAthlete]);
  };

  const updateAthlete = (updatedAthlete: Athlete) => {
    setAthletes(athletes.map(a => a.id === updatedAthlete.id ? updatedAthlete : a));
  };

  const deleteAthlete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este atleta?')) {
      setAthletes(athletes.filter(a => a.id !== id));
      const newPayments = { ...payments };
      delete newPayments[id];
      setPayments(newPayments);
    }
  };

  const togglePayment = (athleteId: string, month: number, year: number = new Date().getFullYear()) => {
    setPayments(prev => {
      const athletePayments = prev[athleteId] || {};
      const yearPayments = athletePayments[year] || {};
      return {
        ...prev,
        [athleteId]: {
          ...athletePayments,
          [year]: {
            ...yearPayments,
            [month]: !yearPayments[month]
          }
        }
      };
    });
  };

  const updateEvaluation = (athleteId: string, metric: keyof EvaluationMetrics, value: number) => {
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        return {
          ...a,
          evaluation: { ...a.evaluation, [metric]: value }
        };
      }
      return a;
    }));
  };

  const updateCategoryThreshold = (categoryId: string, threshold: number) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, threshold } : c));
  };

  const addObservation = (athleteId: string, text: string) => {
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        return {
          ...a,
          observations: [
            { id: generateId(), text, date: new Date().toISOString() },
            ...a.observations
          ]
        };
      }
      return a;
    }));
  };

  const isReadOnly = currentUser?.role === 'ALUNO';
  const isAdmin = currentUser?.role === 'ADMIN';

  const addGoal = (athleteId: string, description: string) => {
    if (isReadOnly) return;
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        const newGoal = {
          id: generateId(),
          description,
          completed: false,
          createdAt: new Date().toISOString()
        };
        return {
          ...a,
          goals: [...(a.goals || []), newGoal]
        };
      }
      return a;
    }));
  };

  const toggleGoal = (athleteId: string, goalId: string) => {
    if (isReadOnly) return;
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        return {
          ...a,
          goals: (a.goals || []).map(g => g.id === goalId ? { ...g, completed: !g.completed } : g)
        };
      }
      return a;
    }));
  };

  const deleteGoal = (athleteId: string, goalId: string) => {
    if (isReadOnly) return;
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        return {
          ...a,
          goals: (a.goals || []).filter(g => g.id !== goalId)
        };
      }
      return a;
    }));
  };

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} users={users} />;
  }

  const rolePermissions = {
    ADMIN: ['CADASTRO', 'CONTABIL', 'CATEGORIAS', 'AGENDA', 'METAS', 'USUARIOS'],
    GESTAO: ['CADASTRO', 'CATEGORIAS', 'AGENDA', 'METAS'],
    ALUNO: ['AGENDA', 'METAS']
  };

  const allowedTabs = rolePermissions[currentUser.role];

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-[#1D1D1F] font-sans overflow-hidden relative">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-[#1C1C1E] text-white rounded-xl shadow-lg ring-4 ring-white"
      >
        {isMobileMenuOpen ? <Plus className="rotate-45" size={24} /> : <LayoutDashboard size={24} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 80 : 260,
          x: (window.innerWidth < 768 && !isMobileMenuOpen) ? -260 : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "bg-[#1C1C1E] text-white flex flex-col shadow-xl z-40 shrink-0 relative overflow-hidden",
          "fixed md:relative h-full"
        )}
      >
        <div className={cn("p-6 flex items-center gap-3 transition-all", (isSidebarCollapsed || (window.innerWidth < 768)) ? "justify-center" : "px-8")}>
          <div className="w-10 min-w-[40px] h-10 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-xl italic shrink-0">R</div>
          {(!isSidebarCollapsed || (window.innerWidth < 768 && isMobileMenuOpen)) && <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">Team Roither</h1>}
        </div>
        
        {/* Toggle Button (Desktop Only) */}
        {!isMobileMenuOpen && (
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute top-[26px] -right-3 w-6 h-6 bg-brand-500 rounded-full items-center justify-center shadow-lg hover:bg-brand-600 transition-colors z-30"
          >
            <motion.div
              animate={{ rotate: isSidebarCollapsed ? 0 : 180 }}
            >
              <ChevronRight size={14} className="text-white" />
            </motion.div>
          </button>
        )}

        <nav className="flex-1 px-4 py-4 space-y-2 mt-8 md:mt-4">
          {allowedTabs.includes('CADASTRO') && (
            <SidebarLink 
              isActive={activeTab === 'CADASTRO'} 
              onClick={() => { setActiveTab('CADASTRO'); setIsMobileMenuOpen(false); }} 
              isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
              icon={<UserPlus size={20} />} 
              label="CADASTRO" 
            />
          )}
          {allowedTabs.includes('CONTABIL') && (
            <SidebarLink 
              isActive={activeTab === 'CONTABIL'} 
              onClick={() => { setActiveTab('CONTABIL'); setIsMobileMenuOpen(false); }} 
              isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
              icon={<DollarSign size={20} />} 
              label="CONTÁBIL" 
            />
          )}
          {allowedTabs.includes('CATEGORIAS') && (
            <SidebarLink 
              isActive={activeTab === 'CATEGORIAS'} 
              onClick={() => { setActiveTab('CATEGORIAS'); setIsMobileMenuOpen(false); }} 
              isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
              icon={<Trophy size={20} />} 
              label="CATEGORIAS" 
            />
          )}
          {allowedTabs.includes('AGENDA') && (
            <SidebarLink 
              isActive={activeTab === 'AGENDA'} 
              onClick={() => { setActiveTab('AGENDA'); setIsMobileMenuOpen(false); }} 
              isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
              icon={<Clock size={20} />} 
              label="AGENDA DE TREINO" 
            />
          )}
          {allowedTabs.includes('METAS') && (
            <SidebarLink 
              isActive={activeTab === 'METAS'} 
              onClick={() => { setActiveTab('METAS'); setIsMobileMenuOpen(false); }} 
              isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
              icon={<Target size={20} />} 
              label="METAS" 
            />
          )}
          {allowedTabs.includes('USUARIOS') && (
            <SidebarLink 
              isActive={activeTab === 'USUARIOS'} 
              onClick={() => { setActiveTab('USUARIOS'); setIsMobileMenuOpen(false); }} 
              isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
              icon={<ShieldCheck size={20} />} 
              label="USUÁRIOS" 
            />
          )}
        </nav>

        <div className={cn("p-6 mt-auto border-t border-white/10 flex flex-col gap-4 transition-all", (isSidebarCollapsed && window.innerWidth >= 768) ? "items-center" : "px-8")}>
          <div className="flex flex-col gap-1 mb-2">
            {!isSidebarCollapsed && (
              <>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">{currentUser.role}</div>
                <div className="text-sm font-bold truncate text-brand-400">{currentUser.name}</div>
              </>
            )}
          </div>
          
          <button 
            onClick={() => setCurrentUser(null)}
            className="flex items-center gap-3 text-red-500/80 hover:text-red-500 transition-colors text-sm font-medium group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            {(!isSidebarCollapsed || (window.innerWidth < 768)) && <span>Sair</span>}
          </button>
          
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} className="opacity-40 shrink-0" />
            {(!isSidebarCollapsed || (window.innerWidth < 768)) && <span className="text-xs opacity-40 font-medium">Versão 1.0.0</span>}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'CADASTRO' && allowedTabs.includes('CADASTRO') && (
            <TabCadastro 
              key="cadastro"
              athletes={athletes} 
              categories={categories} 
              onAdd={addAthlete} 
              onUpdate={updateAthlete}
              onDelete={deleteAthlete}
              onAddObservation={addObservation}
              setCategories={setCategories}
            />
          )}
          {activeTab === 'CONTABIL' && allowedTabs.includes('CONTABIL') && (
            <TabContabil 
              key="contabil"
              athletes={athletes} 
              payments={payments} 
              onTogglePayment={togglePayment} 
            />
          )}
          {activeTab === 'CATEGORIAS' && allowedTabs.includes('CATEGORIAS') && (
            <TabCategorias 
              key="categorias"
              athletes={athletes} 
              categories={categories} 
              onUpdateEvaluation={updateEvaluation}
              onUpdateCategoryThreshold={updateCategoryThreshold}
            />
          )}
          {activeTab === 'AGENDA' && allowedTabs.includes('AGENDA') && (
            <TabAgenda
              key="agenda"
              sessions={trainingSessions}
              categories={categories}
              athletes={athletes}
              onAddSession={(session) => setTrainingSessions([...trainingSessions, { ...session, id: generateId() }])}
              onDeleteSession={(id) => setTrainingSessions(trainingSessions.filter(s => s.id !== id))}
              isReadOnly={isReadOnly}
            />
          )}
          {activeTab === 'METAS' && allowedTabs.includes('METAS') && (
            <TabMetas
              key="metas"
              athletes={athletes}
              categories={categories}
              onAddGoal={addGoal}
              onToggleGoal={toggleGoal}
              onDeleteGoal={deleteGoal}
              isReadOnly={isReadOnly}
            />
          )}
          {activeTab === 'USUARIOS' && allowedTabs.includes('USUARIOS') && (
            <TabUsuarios
              key="usuarios"
              users={users}
              onAddUser={(user) => setUsers([...users, { ...user, id: generateId() }])}
              onDeleteUser={(id) => {
                const u = users.find(x => x.id === id);
                if (u?.username === 'RoitherH2026') return;
                if (window.confirm('Excluir este usuário?')) {
                  setUsers(users.filter(x => x.id !== id));
                }
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Components ---

function SidebarLink({ isActive, onClick, icon, label, isCollapsed }: { isActive: boolean; onClick: () => void; icon: ReactNode; label: string; isCollapsed?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm tracking-wide group",
        isActive 
          ? "bg-brand-500 text-white shadow-[0_4px_12px_rgba(0,127,255,0.4)]" 
          : "text-gray-400 hover:text-white hover:bg-white/5",
        isCollapsed && "justify-center px-0"
      )}
    >
      <div className={cn("shrink-0 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </div>
      {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin, users }: { onLogin: (user: User) => void; users: User[] }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      // Static mapping for RoitherH2026 requested password
      const user = users.find(u => u.username === username);
      const isSuperAdmin = username === 'RoitherH2026' && password === 'teamrt2026';
      
      if (isSuperAdmin) {
        onLogin({ id: '1', username: 'RoitherH2026', name: 'Roither Admin', role: 'ADMIN' });
      } else if (user && user.password === password) {
        onLogin(user);
      } else {
        setError('Usuário ou senha incorretos.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-white rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/20"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200 mb-4 transform -rotate-6">
            <Trophy className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1C1C1E]">Team Roither</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Gestão de Futevôlei Profissional</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Usuário</label>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:border-brand-500 outline-none transition-all font-medium"
                placeholder="Ex: RoitherH2026"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:border-brand-500 outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound size={20} />
                ENTRAR NO SISTEMA
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-300 text-[10px] font-medium tracking-tight uppercase">
          Ambiente restrito • v1.0.0
        </div>
      </motion.div>
    </div>
  );
}

// --- TAB: CADASTRO ---
function TabCadastro({ athletes, categories, onAdd, onUpdate, onDelete, onAddObservation, setCategories }: { 
  athletes: Athlete[]; 
  categories: Category[]; 
  onAdd: (a: any) => void;
  onUpdate: (a: Athlete) => void;
  onDelete: (id: string) => void;
  onAddObservation: (id: string, text: string) => void;
  setCategories: Dispatch<SetStateAction<Category[]>>;
  key?: string;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [newObs, setNewObs] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    side: 'AMBOS' as Athlete['side'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    monthlyFee: 0
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsFormOpen(false);
    setFormData({ ...formData, name: '', monthlyFee: 0 });
  };

  const handleUpdateCategory = (athlete: Athlete, newCatId: string) => {
    const oldCat = categories.find(c => c.id === athlete.categoryId)?.name || 'N/A';
    const newCat = categories.find(c => c.id === newCatId)?.name || 'N/A';
    onUpdate({ ...athlete, categoryId: newCatId });
    onAddObservation(athlete.id, `Categoria alterada de ${oldCat} para ${newCat}.`);
  };

  const handleUpdateSide = (athlete: Athlete, newSide: Athlete['side']) => {
    if (athlete.side === newSide) return;
    onUpdate({ ...athlete, side: newSide });
    onAddObservation(athlete.id, `Lado alterada de ${athlete.side} para ${newSide}.`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Cadastro</h2>
          <p className="text-gray-500 text-sm">Gerencie seus atletas e histórico de evolução.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl border border-gray-200 font-semibold text-xs md:text-sm hover:bg-gray-50 transition-colors"
          >
            <Settings size={18} />
            Categorias
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl bg-[#1C1C1E] text-white font-semibold text-xs md:text-sm hover:bg-black transition-all shadow-md"
          >
            <Plus size={18} />
            Novo Atleta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Athlete List / Mobile Cards */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hidden md:block">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-bottom border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Atleta</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Lado</th>
                  <th className="px-6 py-4">Início</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {athletes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Nenhum atleta cadastrado.</td>
                  </tr>
                ) : athletes.map(athlete => (
                  <tr 
                    key={athlete.id} 
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{athlete.name}</div>
                      <div className="text-xs text-gray-400">R$ {athlete.monthlyFee.toFixed(2)}/mês</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={athlete.categoryId} 
                        onChange={(e) => handleUpdateCategory(athlete, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-100 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter cursor-pointer focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={athlete.side} 
                        onChange={(e) => handleUpdateSide(athlete, e.target.value as Athlete['side'])}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none border-none appearance-none text-center",
                          athlete.side === 'AMBOS' && "bg-purple-50 text-purple-600 focus:ring-purple-500",
                          athlete.side === 'DIREITA' && "bg-orange-50 text-orange-600 focus:ring-orange-500"
                        )}
                      >
                        <option value="ESQUERDA">ESQUERDA</option>
                        <option value="DIREITA">DIREITA</option>
                        <option value="AMBOS">AMBOS</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {format(parseISO(athlete.startDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(athlete.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {athletes.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 font-medium">
                Nenhum atleta cadastrado.
              </div>
            ) : athletes.map(athlete => (
              <div 
                key={athlete.id} 
                onClick={() => setSelectedAthlete(athlete)}
                className={cn(
                  "bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 active:scale-[0.98] transition-all",
                  selectedAthlete?.id === athlete.id && "ring-2 ring-brand-500 ring-offset-2"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{athlete.name}</div>
                    <div className="text-xs text-gray-400">R$ {athlete.monthlyFee.toFixed(2)}/mês</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(athlete.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Categoria</div>
                    <select 
                      value={athlete.categoryId} 
                      onChange={(e) => handleUpdateCategory(athlete, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-gray-50 text-[11px] font-bold px-3 py-2.5 rounded-xl uppercase tracking-tighter cursor-pointer focus:ring-2 focus:ring-brand-500 outline-none border-none"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Lado</div>
                    <select 
                      value={athlete.side} 
                      onChange={(e) => handleUpdateSide(athlete, e.target.value as Athlete['side'])}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "w-full bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-2.5 rounded-xl uppercase tracking-tighter cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none border-none appearance-none text-center",
                        athlete.side === 'AMBOS' && "bg-purple-50 text-purple-600 focus:ring-purple-500",
                        athlete.side === 'DIREITA' && "bg-orange-50 text-orange-600 focus:ring-orange-500"
                      )}
                    >
                      <option value="ESQUERDA">ESQUERDA</option>
                      <option value="DIREITA">DIREITA</option>
                      <option value="AMBOS">AMBOS</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="text-[10px] font-medium text-gray-400">
                    Início: {format(parseISO(athlete.startDate), 'dd/MM/yyyy')}
                  </div>
                  <div className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">
                    Ver Histórico <ChevronRight size={10} className="inline ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observation History Panel */}
        <div className="space-y-4">
          <div className={cn(
            "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col transition-all duration-300",
            !selectedAthlete && "opacity-50 grayscale pointer-events-none"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <History size={20} />
              </div>
              <div>
                <h3 className="font-bold">Histórico de Evolução</h3>
                <p className="text-xs text-gray-400">{selectedAthlete?.name || 'Selecione um atleta'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[500px]">
              {selectedAthlete?.observations.map((obs, idx) => (
                <div key={obs.id} className="relative pl-6 pb-4 border-l border-gray-100 last:border-0 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 bg-brand-400 rounded-full ring-4 ring-white" />
                  <div className="text-[10px] uppercase font-bold text-gray-300 mb-1">
                    {format(parseISO(obs.date), 'dd MMM yyyy, HH:mm')}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{obs.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nova observação..." 
                  className="flex-1 text-sm bg-gray-50 border-0 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newObs && selectedAthlete) {
                      onAddObservation(selectedAthlete.id, newObs);
                      setNewObs('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newObs && selectedAthlete) {
                      onAddObservation(selectedAthlete.id, newObs);
                      setNewObs('');
                    }
                  }}
                  className="p-2.5 bg-[#1C1C1E] text-white rounded-xl hover:bg-black transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Novo Atleta */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative"
          >
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <Plus className="rotate-45" size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6">Cadastro de Atleta</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Categoria</label>
                  <select 
                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Lado na Quadra</label>
                  <select 
                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                    value={formData.side}
                    onChange={e => setFormData({...formData, side: e.target.value as any})}
                  >
                    <option value="AMBOS">AMBOS</option>
                    <option value="DIREITA">DIREITA</option>
                    <option value="ESQUERDA">ESQUERDA</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Data Início</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Mensalidade (R$)</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.monthlyFee}
                    onChange={e => setFormData({...formData, monthlyFee: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-500 text-white font-bold py-4 rounded-2xl mt-4 hover:bg-brand-600 transition-all shadow-[0_8px_20px_rgba(0,127,255,0.3)] active:scale-[0.98]"
              >
                CADASTRAR ATLETA
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Gestão de Categorias */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative"
          >
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <Plus className="rotate-45" size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6">Gestão de Categorias</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <input 
                    type="color" 
                    value={cat.color || '#3B82F6'} 
                    onChange={(e) => {
                      setCategories(categories.map(c => c.id === cat.id ? { ...c, color: e.target.value } : c));
                    }}
                    className="w-6 h-6 rounded-md border-none cursor-pointer bg-transparent"
                  />
                  <span className="flex-1 font-semibold text-sm">{cat.name}</span>
                  {!cat.isDefault && (
                    <button 
                      onClick={() => setCategories(categories.filter(c => c.id !== cat.id))}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                id="new-category-input"
                type="text" 
                placeholder="Nome da categoria..." 
                className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      setCategories([...categories, { id: generateId(), name: val.toUpperCase(), isDefault: false }]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button 
                className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold text-sm"
                onClick={() => {
                  const input = document.getElementById('new-category-input') as HTMLInputElement;
                  if (input.value) {
                    setCategories([...categories, { id: generateId(), name: input.value.toUpperCase(), isDefault: false }]);
                    input.value = '';
                  }
                }}
              >
                ADICIONAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- TAB: CONTABIL ---
function TabContabil({ athletes, payments, onTogglePayment }: { 
  athletes: Athlete[]; 
  payments: PaymentStatus; 
  onTogglePayment: (id: string, month: number, year: number) => void;
  key?: string;
}) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthStats, setSelectedMonthStats] = useState(new Date().getMonth());
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Dados para o Gráfico de Faturamento Anual (Mês a Mês)
  const annualRevenueData = useMemo(() => {
    return months.map((monthName, monthIndex) => {
      const monthlyRevenue = athletes.reduce((acc, athlete) => {
        const isPaid = payments[athlete.id]?.[selectedYear]?.[monthIndex];
        return isPaid ? acc + athlete.monthlyFee : acc;
      }, 0);
      return {
        name: monthName,
        faturamento: monthlyRevenue
      };
    });
  }, [athletes, payments, selectedYear]);

  // Dados para o Gráfico de Status Mensal (Atletas Pagos vs Pendentes no mês selecionado)
  const monthlyStats = useMemo(() => {
    let paidCount = 0;
    let pendingCount = 0;

    athletes.forEach(a => {
      const isPaid = payments[a.id]?.[selectedYear]?.[selectedMonthStats];
      if (isPaid) paidCount++;
      else pendingCount++;
    });

    return {
      paid: paidCount,
      pending: pendingCount,
      chartData: [
        { name: 'Pagos', value: paidCount },
        { name: 'Pendentes', value: pendingCount }
      ]
    };
  }, [athletes, payments, selectedYear, selectedMonthStats]);

  const totalYearlyRevenue = useMemo(() => {
    return annualRevenueData.reduce((acc, data) => acc + data.faturamento, 0);
  }, [annualRevenueData]);

  const potentialYearlyRevenue = athletes.reduce((acc, a) => acc + (a.monthlyFee * 12), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>
          <p className="text-gray-500 text-sm">Controle de mensalidades e faturamento de {selectedYear}.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ano Base</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="h-10 w-px bg-gray-100 hidden md:block" />

          <div className="flex gap-8 text-right">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faturamento Anual</div>
              <div className="text-2xl font-bold text-green-600">R$ {totalYearlyRevenue.toLocaleString()}</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Potencial</div>
              <div className="text-2xl font-bold text-gray-300">R$ {potentialYearlyRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Faturamento Anual */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              Faturamento Mensal ({selectedYear})
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <RechartsTooltip 
                  cursor={{fill: '#F9FAFB'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="faturamento" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status de Pagamento (Mês Específico) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold flex items-center gap-2">
              <Users size={18} className="text-brand-500" />
              Status de Atletas
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Mês:</span>
              <select 
                value={selectedMonthStats}
                onChange={(e) => setSelectedMonthStats(parseInt(e.target.value))}
                className="bg-gray-50 border-none rounded-lg px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-brand-500 outline-none"
              >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthlyStats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F87171" />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-3 h-3 bg-green-500 rounded-full" /> {monthlyStats.paid} Pagos
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-3 h-3 bg-red-400 rounded-full" /> {monthlyStats.pending} Pendentes
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Tabela de Pagamentos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <h3 className="font-bold text-sm">Lista de Pagamentos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Atleta</th>
                {months.map(m => (
                  <th key={m} className="px-3 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-gray-400 font-medium">Nenhum atleta disponível para cobrança.</td>
                </tr>
              ) : athletes.map(athlete => (
                <tr key={athlete.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-white font-bold text-sm shadow-[2px_0_5px_rgba(0,0,0,0.02)] flex flex-col">
                    <span>{athlete.name}</span>
                    <span className="text-[10px] text-gray-400 font-normal">R$ {athlete.monthlyFee}</span>
                  </td>
                  {months.map((_, idx) => {
                    const isPaid = payments[athlete.id]?.[selectedYear]?.[idx];
                    return (
                      <td key={idx} className="px-3 py-4 text-center">
                        <button 
                          onClick={() => onTogglePayment(athlete.id, idx, selectedYear)}
                          className={cn(
                            "w-5 h-5 mx-auto rounded-md border-2 transition-all flex items-center justify-center",
                            isPaid 
                              ? "bg-green-500 border-green-500 text-white shadow-sm" 
                              : "border-gray-200 hover:border-brand-200"
                          )}
                        >
                          {isPaid && <Plus className="rotate-45" size={12} strokeWidth={4} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// --- TAB: METAS ---
function TabMetas({ athletes, categories, onAddGoal, onToggleGoal, onDeleteGoal, isReadOnly }: {
  athletes: Athlete[];
  categories: Category[];
  onAddGoal: (athleteId: string, description: string) => void;
  onToggleGoal: (athleteId: string, goalId: string) => void;
  onDeleteGoal: (athleteId: string, goalId: string) => void;
  isReadOnly?: boolean;
  key?: string;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  const [newGoalText, setNewGoalText] = useState('');

  const filteredAthletes = useMemo(() => {
    if (selectedCategoryId === 'ALL') return athletes;
    return athletes.filter(a => a.categoryId === selectedCategoryId);
  }, [athletes, selectedCategoryId]);

  const selectedAthlete = useMemo(() => {
    return athletes.find(a => a.id === selectedAthleteId);
  }, [athletes, selectedAthleteId]);

  const calculateAverage = (evalData: EvaluationMetrics) => {
    const values = Object.values(evalData);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <h2 className="text-2xl font-bold mb-2">Metas dos Atletas</h2>
        <p className="text-gray-500 text-sm">Acompanhe e desafie seus atletas com metas personalizadas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:h-[calc(100vh-250px)]">
        {/* Left: Athlete Selector */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-[400px] lg:max-h-none">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 shrink-0 space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Filtrar por Categoria</h3>
            <select 
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                // Reset selection if current athlete is not in filtered list
                const newFiltered = e.target.value === 'ALL' ? athletes : athletes.filter(a => a.categoryId === e.target.value);
                if (newFiltered.length > 0 && !newFiltered.some(a => a.id === selectedAthleteId)) {
                  setSelectedAthleteId(newFiltered[0].id);
                }
              }}
              className="w-full bg-white border border-gray-200 text-xs font-bold px-3 py-2 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="ALL">TODAS AS CATEGORIAS</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredAthletes.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs italic">
                Nenhum atleta nesta categoria.
              </div>
            ) : filteredAthletes.map(athlete => (
              <button
                key={athlete.id}
                onClick={() => setSelectedAthleteId(athlete.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl transition-all group",
                  selectedAthleteId === athlete.id 
                    ? "bg-brand-500 text-white shadow-md" 
                    : "hover:bg-gray-50 text-gray-600"
                )}
              >
                <div className="font-bold text-sm truncate">{athlete.name}</div>
                <div className={cn(
                  "text-[10px] font-mono flex flex-col",
                  selectedAthleteId === athlete.id ? "text-white/70" : "text-gray-400"
                )}>
                  <span>Categoria: {categories.find(c => c.id === athlete.categoryId)?.name || 'Sem Categoria'}</span>
                  <span>Média: {calculateAverage(athlete.evaluation)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Goals Management */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full min-h-[400px]">
          {selectedAthlete ? (
            <>
              {/* Profile Header */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedAthlete.name}</h2>
                    <div className="bg-brand-100 text-brand-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                      MÉDIA ATUAL: {calculateAverage(selectedAthlete.evaluation)}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider font-medium">
                    {selectedAthlete.side} • {categories.find(c => c.id === selectedAthlete.categoryId)?.name || 'SEM CATEGORIA'}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                  <div className="text-center">
                    <div className="text-2xl font-black text-brand-500">{selectedAthlete.goals?.filter(g => g.completed).length || 0}</div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Concluídas</div>
                  </div>
                  <div className="text-center border-l border-gray-100 pl-6">
                    <div className="text-2xl font-black text-gray-300">{selectedAthlete.goals?.length || 0}</div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total</div>
                  </div>
                </div>
              </div>

              {/* Goals List */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50/20 gap-4">
                  <h3 className="font-bold text-gray-800">Metas e Objetivos</h3>
                  {!isReadOnly && (
                    <div className="bg-white border rounded-xl flex items-center gap-2 px-3 py-1.5 shadow-sm w-full md:w-auto">
                       <Plus size={14} className="text-gray-400" />
                       <input 
                          type="text" 
                          placeholder="Nova meta..."
                          className="bg-transparent border-none text-xs outline-none flex-1 md:w-64 font-medium"
                          value={newGoalText}
                          onChange={(e) => setNewGoalText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newGoalText) {
                              onAddGoal(selectedAthlete.id, newGoalText);
                              setNewGoalText('');
                            }
                          }}
                       />
                       <button 
                          disabled={!newGoalText}
                          onClick={() => {
                            onAddGoal(selectedAthlete.id, newGoalText);
                            setNewGoalText('');
                          }}
                          className="text-[10px] font-black text-brand-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          SALVAR
                        </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {(!selectedAthlete.goals || selectedAthlete.goals.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2 opacity-50">
                      <Target size={48} strokeWidth={1} />
                      <p className="text-sm italic">Nenhuma meta traçada para este atleta.</p>
                    </div>
                  ) : selectedAthlete.goals.map(goal => (
                    <div 
                      key={goal.id} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center gap-4 group",
                        goal.completed 
                          ? "bg-green-50/30 border-green-100" 
                          : "bg-white border-gray-100 hover:border-brand-200 shadow-sm"
                      )}
                    >
                      <button 
                        onClick={() => onToggleGoal(selectedAthlete.id, goal.id)}
                        disabled={isReadOnly}
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center transition-all border-2 shrink-0",
                          goal.completed 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-gray-200 hover:border-brand-500",
                          isReadOnly && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {goal.completed && <Plus size={16} className="rotate-45" />}
                      </button>
                      
                      <div className="flex-1">
                        <div className={cn(
                          "text-sm font-bold transition-all",
                          goal.completed ? "text-green-600 line-through opacity-50" : "text-gray-800"
                        )}>
                          {goal.description}
                        </div>
                        <div className="text-[9px] text-gray-400 font-medium">
                          Criada em: {format(parseISO(goal.createdAt), 'dd MMMM, HH:mm', { locale: ptBR })}
                        </div>
                      </div>

                      {!isReadOnly && (
                        <button 
                          onClick={() => onDeleteGoal(selectedAthlete.id, goal.id)}
                          className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="text-center space-y-3 opacity-30">
                  <Users size={64} strokeWidth={1} className="mx-auto" />
                  <p className="text-sm font-bold uppercase tracking-widest">Selecione um atleta para ver as metas</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- TAB: CATEGORIAS ---
function TabCategorias({ athletes, categories, onUpdateEvaluation, onUpdateCategoryThreshold }: { 
  athletes: Athlete[]; 
  categories: Category[]; 
  onUpdateEvaluation: (id: string, metric: any, value: number) => void;
  onUpdateCategoryThreshold: (categoryId: string, threshold: number) => void;
  key?: string;
}) {
  const [activeSubTab, setActiveSubTab] = useState<CategoryId>(categories[0]?.id || '');

  const activeCategory = useMemo(() => {
    return categories.find(c => c.id === activeSubTab);
  }, [categories, activeSubTab]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => a.categoryId === activeSubTab);
  }, [athletes, activeSubTab]);

  const calculateAverage = (evalData: EvaluationMetrics) => {
    const values = Object.values(evalData);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="space-y-8 h-full flex flex-col"
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold">Avaliação de Performance</h2>
          
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex flex-col">
              Nota de Corte
              <span className="text-[8px] font-bold normal-case tracking-normal">Média para subir de categoria</span>
            </div>
            <input 
              type="number"
              min="0"
              max="100"
              value={activeCategory?.threshold || 0}
              onChange={(e) => onUpdateCategoryThreshold(activeSubTab, parseInt(e.target.value) || 0)}
              className="w-16 bg-white border-2 border-gray-200 rounded-xl px-2 py-1.5 text-sm font-black text-center focus:border-brand-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveSubTab(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-200 border border-transparent",
                activeSubTab === cat.id 
                  ? "bg-brand-50 text-brand-600 border-brand-100 shadow-sm shadow-brand-100" 
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1C1C1E] text-white">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest sticky left-0 bg-[#1C1C1E] z-10">Atleta</th>
                {Object.entries(EVALUATION_LABELS).map(([key, label]) => (
                  <th key={key} className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-center">{label}</th>
                ))}
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-center bg-brand-500">MÉDIA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan={Object.keys(EVALUATION_LABELS).length + 2} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Users size={48} />
                      <p className="font-medium">Nenhum atleta nesta categoria.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAthletes.map(athlete => (
                <tr 
                  key={athlete.id} 
                  className={cn(
                    "group transition-colors odd:bg-gray-50/30",
                    activeCategory?.threshold && calculateAverage(athlete.evaluation) >= activeCategory.threshold 
                      ? "bg-green-50/50 hover:bg-green-100/50" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <td className="px-6 py-5 sticky left-0 bg-inherit z-10 transition-colors border-r border-gray-50">
                    <div className="flex items-center gap-2">
                       <div className="font-bold text-sm text-gray-900">{athlete.name}</div>
                       {activeCategory?.threshold && calculateAverage(athlete.evaluation) >= activeCategory.threshold && (
                         <div className="bg-green-500 text-white p-0.5 rounded-full" title="Pronto para subir de categoria">
                            <ChevronRight size={10} strokeWidth={4} className="-mr-0.5 rotate-[-90deg] translate-y-[-1px]" />
                         </div>
                       )}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-mono">{athlete.side}</div>
                  </td>
                  {Object.keys(EVALUATION_LABELS).map((metric) => (
                    <td key={metric} className="px-4 py-5">
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={athlete.evaluation[metric as keyof EvaluationMetrics]}
                          onChange={(e) => onUpdateEvaluation(athlete.id, metric, parseInt(e.target.value) || 0)}
                          className="w-14 bg-gray-100 border-none rounded-lg px-2 py-1.5 text-xs font-mono text-center focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                  ))}
                  <td className={cn(
                    "px-6 py-5 text-center transition-colors",
                    activeCategory?.threshold && calculateAverage(athlete.evaluation) >= activeCategory.threshold 
                      ? "bg-green-500/10" 
                      : "bg-brand-50/50 group-hover:bg-brand-100/50"
                  )}>
                    <span className={cn(
                      "text-sm font-black font-mono tracking-tighter",
                      activeCategory?.threshold && calculateAverage(athlete.evaluation) >= activeCategory.threshold 
                        ? "text-green-600" 
                        : "text-brand-600"
                    )}>
                      {calculateAverage(athlete.evaluation)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAthletes.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
              <TrendingUp size={14} className="text-brand-500" />
              <span>DICA: Use os campos acima para avaliar o desempenho. A média é calculada automaticamente.</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MiniCalendar({ sessions, categories }: { sessions: TrainingSession[], categories: Category[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
const calendarDaysArray = calendarDays;

  const getTrainingSession = (day: Date) => {
    const dayIndex = getDay(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    
    return sessions.find(s => {
      if (s.type === 'RECURRING') {
        return s.daysOfWeek?.includes(dayIndex);
      } else if (s.type === 'PERSONALIZED' && s.date) {
        return s.date === dateStr;
      }
      return false;
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-72 shrink-0 h-fit">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xs uppercase tracking-widest text-[#1D1D1F]">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="text-[10px] font-black text-gray-300">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDaysArray.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const trSession = getTrainingSession(day);
          const isToday = isSameDay(day, new Date());
          const cat = trSession ? categories.find(c => c.id === trSession.categoryId) : null;
          
          return (
            <div 
              key={i} 
              className={cn(
                "h-8 flex flex-col items-center justify-center text-xs font-bold rounded-lg relative transition-all",
                !isCurrentMonth ? "text-gray-200" : "text-gray-600 hover:bg-gray-50",
                trSession && isCurrentMonth && "bg-gray-50",
                isToday && "ring-2 ring-brand-500 ring-offset-2"
              )}
            >
              {format(day, 'd')}
              {trSession && isCurrentMonth && (
                <div 
                  className="w-1.5 h-1.5 rounded-full mt-0.5" 
                  style={{ backgroundColor: cat?.color || '#007FFF' }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-50">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="w-2 h-2 bg-brand-500 rounded-full" />
          Dias de Treino
        </div>
      </div>
    </div>
  );
}

// --- TAB: AGENDA ---
function TabAgenda({ sessions, categories, athletes, onAddSession, onDeleteSession, isReadOnly }: {
  sessions: TrainingSession[];
  categories: Category[];
  athletes: Athlete[];
  onAddSession: (s: Omit<TrainingSession, 'id'>) => void;
  onDeleteSession: (id: string) => void;
  isReadOnly?: boolean;
  key?: string;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<TrainingSession, 'id'>>({
    type: 'RECURRING',
    daysOfWeek: [],
    startTime: '17:30',
    endTime: '18:30',
    description: '',
    categoryId: categories[0]?.id
  });

  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const toggleDay = (dayIndex: number) => {
    setFormData(prev => {
      const current = prev.daysOfWeek || [];
      const next = current.includes(dayIndex) 
        ? current.filter(d => d !== dayIndex)
        : [...current, dayIndex];
      return { ...prev, daysOfWeek: next };
    });
  };

  const getSessionsForDay = (dayIndex: number) => {
    return sessions.filter(s => {
      if (s.type === 'RECURRING') {
        return s.daysOfWeek?.includes(dayIndex);
      }
      // Personalized logic could be more complex, for now just show recurring in weekly grid
      return false; 
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold">Agenda de Treinos</h2>
          <p className="text-gray-500 text-sm">Visualize e organize os horários de treino semanais.</p>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1C1C1E] text-white font-semibold text-sm hover:bg-black transition-all shadow-md"
          >
            <Plus size={18} />
            Agendar Treino
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Calendar Grid */}
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day, idx) => (
              <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                <div className={cn(
                  "p-3 text-center border-b border-gray-50 font-black text-[10px] uppercase tracking-widest",
                  idx === 0 || idx === 6 ? "text-red-400 bg-red-50/30" : "text-gray-400 bg-gray-50/30"
                )}>
                  {day}
                </div>
                <div className="flex-1 p-3 space-y-3">
                  {getSessionsForDay(idx).length === 0 ? (
                    <div className="h-full flex items-center justify-center italic text-[10px] text-gray-300 text-center px-2">Sem treinos</div>
                  ) : getSessionsForDay(idx).map(session => {
                    const cat = categories.find(c => c.id === session.categoryId);
                    return (
                      <div 
                        key={session.id} 
                        className="p-3 rounded-xl border group relative transition-all"
                        style={{ 
                          backgroundColor: cat?.color ? `${cat.color}15` : '#F0F7FF',
                          borderColor: cat?.color ? `${cat.color}30` : '#E0EFFF'
                        }}
                      >
                        {!isReadOnly && (
                          <button 
                            onClick={() => onDeleteSession(session.id)}
                            className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                            style={{ color: cat?.color || '#3B82F6' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        <div 
                          className="text-[9px] font-black mb-1"
                          style={{ color: cat?.color || '#2563EB' }}
                        >
                          {session.startTime} - {session.endTime}
                        </div>
                        <div className="text-xs font-bold text-gray-800 line-clamp-2">{session.description || cat?.name}</div>
                        {cat && (
                          <div 
                            className="mt-1 text-[8px] font-bold uppercase tracking-tighter"
                            style={{ color: cat?.color || '#3B82F6', opacity: 0.8 }}
                          >
                            {cat.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de Treinos Personalizados/Lista Completa */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold mb-4">Lista Completa de Horários</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sessions.map(s => {
                const cat = categories.find(c => c.id === s.categoryId);
                return (
                  <div 
                    key={s.id} 
                    className="p-4 rounded-2xl border transition-all flex flex-col gap-2"
                    style={{ 
                      backgroundColor: cat?.color ? `${cat.color}08` : '#F9FAFB',
                      borderColor: cat?.color ? `${cat.color}20` : '#F3F4F6'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        s.type === 'RECURRING' ? "bg-white/80 text-blue-600" : "bg-white/80 text-purple-600 shadow-sm"
                      )}
                      style={{ color: s.type === 'RECURRING' ? (cat?.color || '#3B82F6') : '#A855F7' }}
                      >
                        {s.type === 'RECURRING' ? 'Recorrente' : 'Personalizado'}
                      </span>
                      {!isReadOnly && (
                        <button onClick={() => onDeleteSession(s.id)} className="text-gray-300 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="text-sm font-bold text-gray-800">{s.description || cat?.name || 'Sem descrição'}</div>
                    <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                      <Clock size={12} style={{ color: cat?.color || '#999' }} /> {s.startTime} - {s.endTime}
                    </div>
                    {s.type === 'RECURRING' && (
                      <div className="text-[10px] text-gray-400 font-medium">
                        Dias: {s.daysOfWeek?.map(d => days[d].slice(0, 3)).join(', ')}
                      </div>
                    )}
                     {s.type === 'PERSONALIZED' && s.date && (
                      <div className="text-[10px] text-gray-400 font-medium">
                        Data: {s.date ? format(parseISO(s.date), 'dd/MM/yyyy') : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Mini Calendar */}
        <MiniCalendar sessions={sessions} categories={categories} />
      </div>

      {/* Modal: Agendar Treino */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative"
          >
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <Plus className="rotate-45" size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6">Agendar Novo Treino</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); onAddSession(formData); setIsFormOpen(false); }} className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, type: 'RECURRING'})}
                  className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", formData.type === 'RECURRING' ? "bg-white shadow-sm" : "text-gray-400")}
                >RECORRENTE</button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, type: 'PERSONALIZED'})}
                  className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", formData.type === 'PERSONALIZED' ? "bg-white shadow-sm" : "text-gray-400")}
                >PERSONALIZADO</button>
              </div>

              {formData.type === 'RECURRING' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                          formData.daysOfWeek?.includes(i) 
                            ? "bg-brand-500 text-white border-brand-500" 
                            : "bg-white text-gray-400 border-gray-100"
                        )}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Data Específica</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Hora Início</label>
                  <input 
                    type="time" 
                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Hora Fim</label>
                  <input 
                    type="time" 
                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Descrição / Categoria</label>
                <div className="flex gap-2">
                  <select 
                     className="w-1/2 bg-gray-50 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                     value={formData.categoryId || ''}
                     onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Ex: Treino Técnico"
                    className="w-1/2 bg-gray-50 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-xl mt-4 hover:bg-black transition-all"
              >
                SALVAR NO CALENDÁRIO
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- TAB: USUARIOS ---
function TabUsuarios({ users, onAddUser, onDeleteUser }: {
  users: User[];
  onAddUser: (u: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  key?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    username: '',
    password: '',
    name: '',
    role: 'ALUNO'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
          <p className="text-gray-500 text-sm">Controle quem tem acesso ao sistema e quais suas permissões.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-all shadow-md"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-bottom border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-black text-xs">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    {u.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-gray-400">{u.username}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                    u.role === 'ADMIN' ? "bg-purple-100 text-purple-600" : 
                    u.role === 'GESTAO' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  )}>
                    {u.role === 'ADMIN' ? <ShieldCheck size={12}/> : <UserIcon size={12}/>}
                    {u.role}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {u.username !== 'RoitherH2026' && (
                    <button 
                      onClick={() => onDeleteUser(u.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Novo Usuário</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                onAddUser(formData);
                setIsModalOpen(false);
                setFormData({ username: '', password: '', name: '', role: 'ALUNO' });
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Usuário de Acesso</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                    placeholder="Ex: joao2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Senha</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Cargo / Permissão</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm tracking-tight"
                  >
                    <option value="GESTAO">GESTÃO (Acesso Manutenção)</option>
                    <option value="ALUNO">ALUNO (Acesso Leitura)</option>
                  </select>
                </div>
                
                <button type="submit" className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl mt-4">
                  CRIAR CONTA
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
