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
  Download,
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
  Edit2,
  Check,
  Bell,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
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
  PaymentHistory,
  PaymentHistoryEntry,
  EVALUATION_LABELS,
  EvaluationMetrics,
  CategoryId,
  TrainingSession,
  User,
  UserRole,
  GoalHistoryEntry,
  Expense
} from './types';

// --- Utility: ID Generation ---
// --- Utils ---
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
  const [activeTab, setActiveTab] = useState<'ATLETAS' | 'CONTABIL' | 'CADASTRO' | 'DESPESAS' | 'CATEGORIAS' | 'AGENDA' | 'METAS' | 'USUARIOS'>('CADASTRO');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [athletes, setAthletes] = useLocalStorage<Athlete[]>('atletapro_athletes_v2', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('atletapro_categories', DEFAULT_CATEGORIES);
  const [payments, setPayments] = useLocalStorage<PaymentStatus>('atletapro_payments_v2', {});
  const [paymentHistory, setPaymentHistory] = useLocalStorage<PaymentHistory>('atletapro_payment_history', {});
  const [trainingSessions, setTrainingSessions] = useLocalStorage<TrainingSession[]>('atletapro_training_v2', []);
  const [paymentDueDate, setPaymentDueDate] = useLocalStorage<number>('atletapro_due_date', 10);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('atletapro_expenses', []);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);

  // --- Handlers ---
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses([...expenses, { ...expense, id: generateId() }]);
  };

  const deleteExpense = (id: string) => {
    if (window.confirm('Excluir esta despesa?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };
  const addAthlete = (athlete: Omit<Athlete, 'id' | 'observations' | 'evaluation' | 'status'>) => {
    const newAthlete: Athlete = {
      ...athlete,
      id: generateId(),
      status: 'ATIVO',
      observations: [
        { id: generateId(), text: 'Atleta cadastrado no sistema.', date: new Date().toISOString() }
      ],
      evaluation: {
        chapa: 0, peito: 0, ombro: 0, defesa: 0, ataque: 0, recepcao: 0, levantamento: 0
      }
    };
    setAthletes([...athletes, newAthlete]);
  };

  const toggleAthleteStatus = (athleteId: string) => {
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        const newStatus = a.status === 'ATIVO' ? 'DESATIVADO' : 'ATIVO';
        return {
          ...a,
          status: newStatus,
          observations: [
            { id: generateId(), text: `Status alterado para ${newStatus}.`, date: new Date().toISOString() },
            ...a.observations
          ]
        };
      }
      return a;
    }));
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
    const isPaid = !payments[athleteId]?.[year]?.[month];
    
    setPayments(prev => {
      const athletePayments = prev[athleteId] || {};
      const yearPayments = athletePayments[year] || {};
      return {
        ...prev,
        [athleteId]: {
          ...athletePayments,
          [year]: {
            ...yearPayments,
            [month]: isPaid
          }
        }
      };
    });

    const historyEntry: PaymentHistoryEntry = {
      id: generateId(),
      month,
      year,
      action: isPaid ? 'PAID' : 'UNPAID',
      timestamp: new Date().toISOString(),
      changedBy: currentUser?.name || 'Sistema'
    };

    setPaymentHistory(prev => ({
      ...prev,
      [athleteId]: [historyEntry, ...(prev[athleteId] || [])]
    }));
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
        const goalId = generateId();
        const timestamp = new Date().toISOString();
        const newGoal = {
          id: goalId,
          description,
          completed: false,
          createdAt: timestamp
        };
        const historyEntry: GoalHistoryEntry = {
          id: generateId(),
          goalId,
          description,
          action: 'CREATED',
          timestamp
        };
        return {
          ...a,
          goals: [...(a.goals || []), newGoal],
          goalHistory: [...(a.goalHistory || []), historyEntry]
        };
      }
      return a;
    }));
  };

  const toggleGoal = (athleteId: string, goalId: string) => {
    if (isReadOnly) return;
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        const goal = (a.goals || []).find(g => g.id === goalId);
        if (!goal) return a;
        
        const timestamp = new Date().toISOString();
        const historyEntry: GoalHistoryEntry = {
          id: generateId(),
          goalId,
          description: goal.description,
          action: goal.completed ? 'UNCOMPLETED' : 'COMPLETED',
          timestamp
        };

        return {
          ...a,
          goals: (a.goals || []).map(g => g.id === goalId ? { ...g, completed: !g.completed } : g),
          goalHistory: [...(a.goalHistory || []), historyEntry]
        };
      }
      return a;
    }));
  };

  const deleteGoal = (athleteId: string, goalId: string) => {
    if (isReadOnly) return;
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        const goal = (a.goals || []).find(g => g.id === goalId);
        if (!goal) return a;

        const timestamp = new Date().toISOString();
        const historyEntry: GoalHistoryEntry = {
          id: generateId(),
          goalId,
          description: goal.description,
          action: 'DELETED',
          timestamp
        };

        return {
          ...a,
          goals: (a.goals || []).filter(g => g.id !== goalId),
          goalHistory: [...(a.goalHistory || []), historyEntry]
        };
      }
      return a;
    }));
  };

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} users={users} />;
  }

  const rolePermissions = {
    ADMIN: ['ATLETAS', 'CADASTRO', 'CONTABIL', 'DESPESAS', 'CATEGORIAS', 'AGENDA', 'METAS', 'USUARIOS'],
    GESTAO: ['ATLETAS', 'CADASTRO', 'CATEGORIAS', 'AGENDA', 'METAS'],
    ALUNO: ['ATLETAS', 'AGENDA', 'METAS']
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

        <nav className="flex-1 px-4 py-4 space-y-10 mt-8 md:mt-4 overflow-y-auto">
          {/* GRUPO 1: GESTÃO E ADMINISTRAÇÃO */}
          <div className="space-y-2">
            {(!isSidebarCollapsed || (window.innerWidth < 768 && isMobileMenuOpen)) && (
              <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Administração</h2>
            )}
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
            {allowedTabs.includes('DESPESAS') && (
              <SidebarLink 
                isActive={activeTab === 'DESPESAS'} 
                onClick={() => { setActiveTab('DESPESAS'); setIsMobileMenuOpen(false); }} 
                isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
                icon={<Plus size={20} className="rotate-45" />} 
                label="DESPESAS" 
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
          </div>

          {/* GRUPO 2: OPERACIONAL E PERFORMANCE */}
          <div className="space-y-2">
            {(!isSidebarCollapsed || (window.innerWidth < 768 && isMobileMenuOpen)) && (
              <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Performance</h2>
            )}
            {allowedTabs.includes('ATLETAS') && (
              <SidebarLink 
                isActive={activeTab === 'ATLETAS'} 
                onClick={() => { setActiveTab('ATLETAS'); setIsMobileMenuOpen(false); }} 
                isCollapsed={isSidebarCollapsed && window.innerWidth >= 768}
                icon={<Users size={20} />} 
                label="ATLETAS" 
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
          </div>
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
          {activeTab === 'ATLETAS' && allowedTabs.includes('ATLETAS') && (
            <TabAtletas 
              key="atletas"
              athletes={athletes}
              categories={categories}
            />
          )}
          {activeTab === 'CADASTRO' && allowedTabs.includes('CADASTRO') && (
            <TabCadastro 
              key="cadastro"
              athletes={athletes} 
              categories={categories} 
              onAdd={addAthlete} 
              onUpdate={updateAthlete}
              onDelete={deleteAthlete}
              onToggleStatus={toggleAthleteStatus}
              onAddObservation={addObservation}
              setCategories={setCategories}
            />
          )}
          {activeTab === 'CONTABIL' && allowedTabs.includes('CONTABIL') && (
            <TabContabil 
              key="contabil"
              athletes={athletes} 
              payments={payments} 
              paymentHistory={paymentHistory}
              onTogglePayment={togglePayment} 
              dueDate={paymentDueDate}
              onUpdateDueDate={setPaymentDueDate}
              expenses={expenses}
            />
          )}
          {activeTab === 'DESPESAS' && allowedTabs.includes('DESPESAS') && (
            <TabDespesas 
              key="despesas"
              expenses={expenses}
              onAdd={addExpense}
              onDelete={deleteExpense}
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
// --- TAB: DESPESAS ---
function TabDespesas({ expenses, onAdd, onDelete }: {
  expenses: Expense[];
  onAdd: (e: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
  key?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'OUTROS',
    isFixed: false,
    paymentMethod: 'PIX'
  });

  const categories = ['OUTROS', 'SALARIOS', 'TRANSPORTES', 'REFEIÇÃO', 'MATERIAIS PARA TREINO', 'TORNEIOS', 'BRINDES', 'UNIFORME'];
  const methods = ['PIX', 'CARTÃO', 'DINHEIRO', 'TRANSF', 'BOLETO'];

  const monthlyTotals = useMemo(() => {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return months.map((name, index) => {
      const total = expenses
        .filter(e => {
          const d = parseISO(e.date);
          return d.getMonth() === index && d.getFullYear() === selectedYear;
        })
        .reduce((acc, e) => acc + e.amount, 0);
      return { name, total };
    });
  }, [expenses, selectedYear]);

  const totalMonthly = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses
      .filter(e => {
        const d = parseISO(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    expenses.forEach(e => years.add(parseISO(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
          <p className="text-gray-500 text-sm">Registre e acompanhe todos os gastos operacionais.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saída Mensal</div>
            <div className="text-2xl font-black text-red-500">R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1C1C1E] text-white font-semibold text-sm hover:bg-black transition-all shadow-md"
          >
            <Plus size={18} />
            Nova Despesa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          {[
            { 
              label: 'Despesas Fixas (Mensal)', 
              value: expenses.filter(e => e.isFixed && parseISO(e.date).getMonth() === new Date().getMonth()).reduce((acc, e) => acc + e.amount, 0),
              color: 'text-brand-600',
              icon: <div className="w-2 h-2 rounded-full bg-brand-500" />
            },
            { 
              label: 'Despesas Variáveis (Mensal)', 
              value: expenses.filter(e => !e.isFixed && parseISO(e.date).getMonth() === new Date().getMonth()).reduce((acc, e) => acc + e.amount, 0),
              color: 'text-amber-600',
              icon: <div className="w-2 h-2 rounded-full bg-amber-500" />
            }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  {stat.icon}
                  {stat.label}
                </div>
                <div className={cn("text-2xl font-black tracking-tight", stat.color)}>
                  R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm mt-auto">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              Informação
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Os valores fixos são calculados com base no mês vigente.</p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group min-h-[300px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Resumo Anual</div>
                <div className="text-gray-900 font-black text-2xl tracking-tighter">
                  R$ {monthlyTotals.reduce((acc, m) => acc + m.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="flex bg-gray-50 p-1 rounded-xl">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest",
                      selectedYear === year 
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-6 flex-1">
              {monthlyTotals.map((m, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="text-[10px] font-black text-gray-400/50 uppercase tracking-widest mb-1">{m.name}</div>
                  <div className={cn(
                    "text-sm font-black",
                    m.total > 0 ? "text-gray-900" : "text-gray-200"
                  )}>
                    R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de Dados Atualizada</span>
              </div>
              <div className="text-[10px] font-black text-brand-500 uppercase">Ano Ativo: {selectedYear}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.sort((a,b) => b.date.localeCompare(a.date)).map(e => (
              <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-gray-400">{format(parseISO(e.date), 'dd/MM/yyyy')}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{e.description}</div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{e.paymentMethod}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase tracking-widest text-gray-500">
                    {e.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold",
                    e.isFixed ? "text-brand-500" : "text-amber-500"
                  )}>
                    {e.isFixed ? 'FIXO' : 'VARIÁVEL'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-red-600">R$ {e.amount.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => onDelete(e.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="p-20 text-center text-gray-300 italic text-sm">Nenhuma despesa registrada.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold uppercase tracking-tight">Lançar Despesa</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Plus className="rotate-45" size={20} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); onAdd(formData); setIsModalOpen(false); }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Descrição</label>
                  <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium" placeholder="Ex: Aluguel Quadra" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Valor (R$)</label>
                    <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Data</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Categoria</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium appearance-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Pagamento</label>
                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium appearance-none">
                      {methods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer group hover:bg-gray-100 transition-all mt-4">
                  <input type="checkbox" checked={formData.isFixed} onChange={e => setFormData({...formData, isFixed: e.target.checked})} className="w-5 h-5 rounded-lg border-2 border-gray-200 text-brand-500 focus:ring-brand-500 transition-all" />
                  <div>
                    <div className="font-bold text-sm">Lançamento Fixo</div>
                    <div className="text-[10px] text-gray-400 font-medium">Marque se esta despesa ocorre todos os meses.</div>
                  </div>
                </label>
                <button type="submit" className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl mt-6 hover:bg-black transition-all shadow-lg active:scale-[0.98]">REGISTRAR DESPESA</button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- TAB: CADASTRO ---
// --- TAB: ATLETAS ---
function TabAtletas({ athletes, categories }: { athletes: Athlete[], categories: Category[], key?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const activeAthletes = useMemo(() => {
    return athletes.filter(a => a.status === 'ATIVO');
  }, [athletes]);

  const calculateAverage = (evaluation: EvaluationMetrics) => {
    const values = Object.values(evaluation);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / values.length).toFixed(1));
  };

  const getAthleteData = (athlete: Athlete) => {
    const cat = categories.find(c => c.id === athlete.categoryId);
    const completedGoals = (athlete.goals || []).filter(g => g.completed).length;
    const pendingGoals = (athlete.goals || []).filter(g => !g.completed).length;
    const average = calculateAverage(athlete.evaluation);
    
    return {
      id: athlete.id,
      name: athlete.name,
      category: cat?.name || 'S/C',
      side: athlete.side,
      startDate: athlete.startDate,
      categoryUpdatedAt: athlete.categoryUpdatedAt || athlete.startDate,
      completedGoals,
      pendingGoals,
      average,
      athlete // keeping reference for original object
    };
  };

  const sortedAndFilteredAthletes = useMemo(() => {
    let result = activeAthletes.map(getAthleteData);

    if (searchTerm) {
      result = result.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedCategoryId !== 'ALL') {
      result = result.filter(a => a.athlete.categoryId === selectedCategoryId);
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [activeAthletes, categories, searchTerm, selectedCategoryId, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const Th = ({ label, sortKey }: { label: string, sortKey?: string }) => (
    <th 
      className={cn(
        "px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 font-sans",
        sortKey && "cursor-pointer hover:text-brand-500 transition-colors"
      )}
      onClick={() => sortKey && handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortKey && <ArrowUpDown size={12} className={cn(sortConfig?.key === sortKey ? "text-brand-500" : "opacity-30")} />}
      </div>
    </th>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Atletas Ativos</h2>
          <p className="text-gray-500 font-medium">Listagem detalhada e acompanhamento de performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar atleta..."
              className="w-full bg-white border-0 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-gray-300 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative group w-full sm:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <select 
              className="w-full bg-white border-0 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none font-medium text-gray-600"
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
            >
              <option value="ALL">Todas Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <Th label="Atleta" sortKey="name" />
                <Th label="Categoria" sortKey="category" />
                <Th label="Lado" sortKey="side" />
                <Th label="Início" sortKey="startDate" />
                <Th label="Troca Cat." sortKey="categoryUpdatedAt" />
                <Th label="Metas" sortKey="pendingGoals" />
                <Th label="Média" sortKey="average" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedAndFilteredAthletes.map((data) => (
                <tr key={data.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{data.name}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {data.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-gray-600">{data.side}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-gray-400 font-mono">
                      {format(parseISO(data.startDate), 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-gray-400 font-mono">
                      {format(parseISO(data.categoryUpdatedAt), 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                          <Check size={10} /> {data.completedGoals}
                        </span>
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <Target size={10} /> {data.pendingGoals}
                        </span>
                      </div>
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div 
                          className="h-full bg-brand-500" 
                          style={{ width: `${(data.completedGoals / (data.completedGoals + data.pendingGoals || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm",
                        data.average >= 7 ? "bg-green-100 text-green-700" :
                        data.average >= 5 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {data.average}
                      </div>
                      {data.average >= 8 && <TrendingUp size={16} className="text-green-500" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedAndFilteredAthletes.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-gray-300 space-y-4">
            <Users size={64} strokeWidth={1} />
            <p className="font-medium italic">Nenhum atleta ativo encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TabCadastro({ athletes, categories, onAdd, onUpdate, onDelete, onToggleStatus, onAddObservation, setCategories }: { 
  athletes: Athlete[]; 
  categories: Category[]; 
  onAdd: (a: any) => void;
  onUpdate: (a: Athlete) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onAddObservation: (id: string, text: string) => void;
  setCategories: Dispatch<SetStateAction<Category[]>>;
  key?: string;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [newObs, setNewObs] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'DESATIVADO'>('ATIVO');

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => a.status === statusFilter);
  }, [athletes, statusFilter]);

  const handleExportCSV = () => {
    const headers = ["Nome", "Telefone", "Categoria", "Lado", "Mensalidade", "Data Inicio", "Status"];
    const rows = athletes.map(a => {
      const cat = categories.find(c => c.id === a.categoryId);
      return [
        a.name,
        a.phone || '',
        cat?.name || 'S/C',
        a.side,
        a.monthlyFee.toFixed(2),
        format(parseISO(a.startDate), 'dd/MM/yyyy'),
        a.status
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(';');
    });
    
    const csvContent = [headers.join(';'), ...rows].join('\n');
    downloadCSV(csvContent, 'atletas_atletapro.csv');
  };

  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    side: 'AMBOS' as Athlete['side'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    monthlyFee: 0,
    phone: ''
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsFormOpen(false);
    setFormData({ ...formData, name: '', monthlyFee: 0, phone: '' });
  };

  const handleUpdateCategory = (athlete: Athlete, newCatId: string) => {
    const oldCat = categories.find(c => c.id === athlete.categoryId)?.name || 'N/A';
    const newCat = categories.find(c => c.id === newCatId)?.name || 'N/A';
    onUpdate({ 
      ...athlete, 
      categoryId: newCatId,
      categoryUpdatedAt: new Date().toISOString()
    });
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
        <div className="flex flex-col gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setStatusFilter('ATIVO')}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                statusFilter === 'ATIVO' 
                  ? "bg-white text-brand-600 shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter('DESATIVADO')}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                statusFilter === 'DESATIVADO' 
                  ? "bg-white text-red-600 shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Desativados
            </button>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm md:hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exportar Dados</span>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-tighter"
            >
              <Download size={14} />
              CSV
            </button>
          </div>

          <div className="hidden md:flex justify-end pr-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm h-10"
            >
              <Download size={14} />
              EXPORTAR LISTA DE ATLETAS (.CSV)
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hidden md:block">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-bottom border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Atleta</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">Nenhum atleta {statusFilter.toLowerCase()}.</td>
                  </tr>
                ) : filteredAthletes.map(athlete => (
                  <tr 
                    key={athlete.id} 
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    <td className="px-6 py-4 w-16">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(athlete.id); }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                          athlete.status === 'ATIVO' ? "bg-green-50 border-green-200 text-green-500" : "bg-red-50 border-red-200 text-red-500"
                        )}
                        title={athlete.status === 'ATIVO' ? "Desativar Atleta" : "Ativar Atleta"}
                      >
                        <div className={cn("w-3 h-3 rounded-full", athlete.status === 'ATIVO' ? "bg-green-500" : "bg-red-500")} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{athlete.name}</div>
                      <div className="text-xs text-gray-400">
                        {athlete.phone && <span className="text-brand-600 font-medium mr-2">{athlete.phone}</span>}
                        R$ {athlete.monthlyFee.toFixed(2)}/mês • Lado: {athlete.side}
                      </div>
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
        </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {filteredAthletes.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 font-medium">
                Nenhum atleta {statusFilter.toLowerCase()}.
              </div>
            ) : filteredAthletes.map(athlete => (
              <div 
                key={athlete.id} 
                onClick={() => setSelectedAthlete(athlete)}
                className={cn(
                  "bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 active:scale-[0.98] transition-all",
                  selectedAthlete?.id === athlete.id && "ring-2 ring-brand-500 ring-offset-2"
                )}
              >
                <div className="flex justify-between items-center bg-gray-50 -m-5 mb-4 p-4 rounded-t-2xl border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", athlete.status === 'ATIVO' ? "bg-green-500" : "bg-red-500")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", athlete.status === 'ATIVO' ? "text-green-600" : "text-red-600")}>
                      {athlete.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleStatus(athlete.id); }}
                      className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      ALTERAR STATUS
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(athlete.id); }}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{athlete.name}</div>
                    <div className="text-xs text-gray-400">
                      {athlete.phone && <span className="text-brand-600 font-medium block mb-1">{athlete.phone}</span>}
                      R$ {athlete.monthlyFee.toFixed(2)}/mês
                    </div>
                  </div>
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
                    <div className="w-full bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-2.5 rounded-xl uppercase tracking-tighter text-center">
                      {athlete.side}
                    </div>
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
                <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                  {selectedAthlete?.name || 'Selecione um atleta'}
                  {selectedAthlete && (
                    <input
                      type="tel"
                      placeholder="Telefone..."
                      className="ml-auto text-[10px] bg-gray-50 border-0 rounded-md px-2 py-1 focus:ring-1 focus:ring-brand-500 outline-none w-28"
                      value={selectedAthlete.phone || ''}
                      onChange={(e) => onUpdate({ ...selectedAthlete, phone: e.target.value })}
                    />
                  )}
                </p>
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
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
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
        <CategoryManagementModal 
          categories={categories}
          setCategories={setCategories}
          athletes={athletes}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      )}
    </motion.div>
  );
}

// --- SUB-COMPONENT: Category Management Modal ---
function CategoryManagementModal({ categories, setCategories, athletes, onClose }: {
  categories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
  athletes: Athlete[];
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newCatName, setNewCatName] = useState('');

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: generateId(),
      name: newCatName.trim().toUpperCase(),
      isDefault: false,
      color: '#3B82F6',
      threshold: 7
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditText(cat.name);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    setCategories(categories.map(c => 
      c.id === editingId ? { ...c, name: editText.trim().toUpperCase() } : c
    ));
    setEditingId(null);
  };

  const handleDelete = (e: any, catId: string) => {
    e.stopPropagation();
    const count = athletes.filter(a => a.categoryId === catId).length;
    if (count > 0) {
      alert(`Esta categoria possui ${count} atleta(s) vinculado(s) e não pode ser excluída. Altere a categoria dos atletas antes de excluir.`);
      return;
    }
    if (window.confirm('Deseja realmente excluir esta categoria?')) {
      setCategories(prev => prev.filter(c => c.id !== catId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
         initial={{ scale: 0.9, opacity: 0 }} 
         animate={{ scale: 1, opacity: 1 }}
         className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500 rounded-lg text-white">
              <Trophy size={20} />
            </div>
            <h3 className="text-xl font-bold">Gestão de Categorias</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="group flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-brand-200 transition-all">
              <input 
                type="color" 
                value={cat.color || '#3B82F6'} 
                onChange={(e) => {
                  setCategories(categories.map(c => c.id === cat.id ? { ...c, color: e.target.value } : c));
                }}
                className="w-10 h-10 rounded-xl border-none cursor-pointer bg-white p-1.5 shadow-sm shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      type="text"
                      className="flex-1 bg-white border border-brand-500 rounded-lg px-3 py-1.5 text-sm font-bold outline-none uppercase"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <button onClick={handleSaveEdit} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 truncate uppercase tracking-tight">{cat.name}</span>
                    <button 
                      onClick={() => handleStartEdit(cat)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-brand-500 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  {athletes.filter(a => a.categoryId === cat.id).length} Atletas
                </div>
              </div>

              {!cat.isDefault && (
                <button 
                  onClick={(e) => handleDelete(e, cat.id)}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nova Categoria</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: INTERMEDIÁRIO..." 
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all uppercase"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button 
                onClick={handleAdd}
                disabled={!newCatName.trim()}
                className="bg-[#1C1C1E] text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Criar</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- TAB: CONTABIL ---
function TabContabil({ athletes, payments, paymentHistory, onTogglePayment, dueDate, onUpdateDueDate, expenses }: { 
  athletes: Athlete[]; 
  payments: PaymentStatus; 
  paymentHistory: PaymentHistory;
  onTogglePayment: (id: string, month: number, year: number) => void;
  dueDate: number;
  onUpdateDueDate: (newDate: number) => void;
  expenses: Expense[];
  key?: string;
}) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthStats, setSelectedMonthStats] = useState(new Date().getMonth());
  const [athleteHistoryId, setAthleteHistoryId] = useState<string | null>(null);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const daysUntilDue = dueDate - currentDay;
  const isDueToday = currentDay === dueDate;
  const isPastDue = currentDay > dueDate;

  const pendingThisMonth = useMemo(() => {
    return athletes.filter(a => a.status === 'ATIVO' && !payments[a.id]?.[currentYear]?.[currentMonth]);
  }, [athletes, payments, currentYear, currentMonth]);

  const handleExportPayments = () => {
    const monthsFull = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const headers = ["Atleta", "Ano", ...monthsFull];
    const rows: string[][] = [];
    
    athletes.forEach(a => {
      const athletePayments = payments[a.id];
      if (athletePayments) {
        Object.keys(athletePayments).forEach(year => {
          const row = [
            a.name,
            year,
            ...Array.from({ length: 12 }, (_, idx) => athletePayments[year][idx] ? 'PAGO' : 'PENDENTE')
          ];
          rows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`));
        });
      }
    });
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csvContent, `pagamentos_atletapro_geral.csv`);
  };
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Dados para o Gráfico de Faturamento Anual (Mês a Mês)
  const financialData = useMemo(() => {
    return months.map((monthName, monthIndex) => {
      const monthlyRevenue = athletes.reduce((acc, athlete) => {
        const isPaid = payments[athlete.id]?.[selectedYear]?.[monthIndex];
        return isPaid ? acc + athlete.monthlyFee : acc;
      }, 0);

      const monthlyExpenses = expenses
        .filter(e => {
          const d = parseISO(e.date);
          return d.getMonth() === monthIndex && d.getFullYear() === selectedYear;
        })
        .reduce((acc, e) => acc + e.amount, 0);

      return {
        name: monthName,
        receita: monthlyRevenue,
        despesa: monthlyExpenses,
        saldo: monthlyRevenue - monthlyExpenses
      };
    });
  }, [athletes, payments, selectedYear, expenses]);

  // Dados para o Gráfico de Status Mensal (Atletas Pagos vs Pendentes no mês selecionado)
  const monthlyStats = useMemo(() => {
    let paidCount = 0;
    let pendingCount = 0;

    athletes.forEach(a => {
      const isPaid = payments[a.id]?.[selectedYear]?.[selectedMonthStats];
      if (isPaid) {
        paidCount++;
      } else if (a.status === 'ATIVO') {
        pendingCount++;
      }
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
    return financialData.reduce((acc, data) => acc + data.receita, 0);
  }, [financialData]);

  const totalYearlyExpenses = useMemo(() => {
    return financialData.reduce((acc, data) => acc + data.despesa, 0);
  }, [financialData]);

  const potentialYearlyRevenue = athletes.filter(a => a.status === 'ATIVO').reduce((acc, a) => acc + (a.monthlyFee * 12), 0);

  const summaryStats = [
    { 
      label: 'Receita Anual', 
      value: `R$ ${totalYearlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: <TrendingUp className="text-green-500" />,
      sub: `${((totalYearlyRevenue / (potentialYearlyRevenue || 1)) * 100).toFixed(1)}% do potencial`
    },
    { 
      label: 'Despesa Anual', 
      value: `R$ ${totalYearlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: <DollarSign className="text-red-500" />,
      sub: `${((totalYearlyExpenses / (totalYearlyRevenue || 1)) * 100).toFixed(1)}% da receita`
    },
    { 
      label: 'Saldo Geral', 
      value: `R$ ${(totalYearlyRevenue - totalYearlyExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: <Check className="text-blue-500" />,
      sub: totalYearlyRevenue > totalYearlyExpenses ? 'Superávit' : 'Déficit'
    },
  ];

  const visibleAthletes = useMemo(() => {
    return athletes.filter(a => {
      if (a.status === 'ATIVO') return true;
      // Para desativados, mostrar apenas se houver algum pagamento no ano selecionado
      const yearPayments = payments[a.id]?.[selectedYear];
      if (yearPayments) {
        return Object.values(yearPayments).some(v => v === true);
      }
      return false;
    });
  }, [athletes, payments, selectedYear]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shadow-inner">
              {stat.icon}
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
              <div className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-bold text-gray-400">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Notificações de Vencimento */}
      {pendingThisMonth.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl flex items-center justify-between shadow-sm border",
            isDueToday 
              ? "bg-amber-50 border-amber-100 text-amber-800" 
              : isPastDue 
                ? "bg-red-50 border-red-100 text-red-800"
                : "bg-brand-50 border-brand-100 text-brand-800"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              isDueToday ? "bg-amber-100" : isPastDue ? "bg-red-100" : "bg-brand-100"
            )}>
              <Bell size={20} />
            </div>
            <div>
              <div className="font-bold text-sm">
                {isDueToday 
                  ? "Hoje é o dia do vencimento!" 
                  : isPastDue 
                    ? `O vencimento foi dia ${dueDate}!` 
                    : `Próximo vencimento: dia ${dueDate}`}
              </div>
              <div className="text-xs opacity-80">
                {pendingThisMonth.length} atleta(s) com mensalidade pendente este mês.
              </div>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/50 rounded-lg">
            {isPastDue ? "Atrasado" : isDueToday ? "Vence Hoje" : `${daysUntilDue} dias restantes`}
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>
          <p className="text-gray-500 text-sm">Controle de mensalidades e faturamento de {selectedYear}.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dia Vencimento</label>
            <select 
              value={dueDate}
              onChange={(e) => onUpdateDueDate(parseInt(e.target.value))}
              className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer w-20"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ano Base</label>
            <div className="flex gap-2">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button
                onClick={handleExportPayments}
                title="Exportar Relatório Geral (.CSV)"
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm"
              >
                <Download size={18} />
              </button>
            </div>
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
              Fluxo Financeiro ({selectedYear})
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-black text-gray-400">RECEITA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-black text-gray-400">DESPESA</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <RechartsTooltip 
                  cursor={{fill: '#F9FAFB'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
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
              {visibleAthletes.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-gray-400 font-medium">Nenhum atleta disponível para cobrança.</td>
                </tr>
              ) : visibleAthletes.map(athlete => (
                <tr 
                  key={athlete.id} 
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors group",
                    athlete.status === 'DESATIVADO' && "bg-red-50/50"
                  )}
                >
                  <td className={cn(
                    "px-6 py-4 sticky left-0 font-bold text-sm shadow-[2px_0_5px_rgba(0,0,0,0.02)] flex flex-col",
                    athlete.status === 'DESATIVADO' ? "bg-red-50" : "bg-white"
                  )}>
                    <div className="flex items-center gap-2">
                       {athlete.status === 'DESATIVADO' && (
                         <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                       )}
                       <span>{athlete.name}</span>
                       <button 
                         onClick={() => setAthleteHistoryId(athlete.id)}
                         className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-brand-500 transition-all opacity-0 group-hover:opacity-100"
                         title="Ver Histórico de Pagamentos"
                       >
                         <History size={14} />
                       </button>
                    </div>
                    <span className="text-[10px] text-gray-400 font-normal">
                      R$ {athlete.monthlyFee} {athlete.status === 'DESATIVADO' && "• DESATIVADO"}
                    </span>
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

      {/* Overlay de Histórico de Pagamentos */}
      <AnimatePresence>
        {athleteHistoryId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setAthleteHistoryId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Histórico de Pagamentos</h3>
                  <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mt-1">
                    {athletes.find(a => a.id === athleteHistoryId)?.name}
                  </p>
                </div>
                <button 
                  onClick={() => setAthleteHistoryId(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <Plus size={20} className="text-gray-400 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(!paymentHistory[athleteHistoryId] || paymentHistory[athleteHistoryId].length === 0) ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-300 space-y-2 opacity-50">
                    <History size={48} strokeWidth={1} />
                    <p className="text-sm italic">Nenhum histórico disponível para este atleta.</p>
                  </div>
                ) : (
                  paymentHistory[athleteHistoryId].map(entry => (
                    <div key={entry.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 items-start">
                      <div className={cn(
                        "p-2.5 rounded-xl shrink-0 shadow-sm",
                        entry.action === 'PAID' 
                          ? "bg-green-100 text-green-600" 
                          : "bg-red-100 text-red-600"
                      )}>
                        {entry.action === 'PAID' ? <Check size={18} /> : <AlertCircle size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Referência: {months[entry.month]} {entry.year}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {format(parseISO(entry.timestamp), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-sm font-bold",
                            entry.action === 'PAID' ? "text-green-600" : "text-red-600"
                          )}>
                            {entry.action === 'PAID' ? 'Marcado como PAGO' : 'Marcado como PENDENTE'}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-1 font-medium italic">
                            Alterado por: <span className="text-gray-800 font-bold not-italic">{entry.changedBy}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  const [showHistory, setShowHistory] = useState(false);

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
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-800">{showHistory ? 'Histórico de Atividades' : 'Metas e Objetivos'}</h3>
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        showHistory ? "bg-brand-500 text-white shadow-sm" : "bg-white border border-gray-100 text-gray-400 hover:text-brand-500"
                      )}
                      title={showHistory ? "Ver Metas Ativas" : "Ver Histórico"}
                    >
                      <History size={16} />
                    </button>
                  </div>
                  {!isReadOnly && !showHistory && (
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

                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {showHistory ? (
                      <motion.div 
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full overflow-y-auto p-6 space-y-4"
                      >
                        {(!selectedAthlete.goalHistory || selectedAthlete.goalHistory.length === 0) ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2 opacity-50">
                            <History size={48} strokeWidth={1} />
                            <p className="text-sm italic">Nenhum histórico disponível.</p>
                          </div>
                        ) : (
                          [...selectedAthlete.goalHistory].reverse().map(entry => (
                            <div key={entry.id} className="flex gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 items-start">
                              <div className={cn(
                                "p-2 rounded-lg shrink-0",
                                entry.action === 'CREATED' ? "bg-blue-100 text-blue-600" :
                                entry.action === 'COMPLETED' ? "bg-green-100 text-green-600" :
                                entry.action === 'DELETED' ? "bg-red-100 text-red-600" :
                                "bg-amber-100 text-amber-600"
                              )}>
                                {entry.action === 'CREATED' && <Plus size={16} />}
                                {entry.action === 'COMPLETED' && <Check size={16} />}
                                {entry.action === 'DELETED' && <Trash2 size={16} />}
                                {entry.action === 'UNCOMPLETED' && <AlertCircle size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {entry.action === 'CREATED' ? 'Nova Meta' :
                                     entry.action === 'COMPLETED' ? 'Meta Concluída' :
                                     entry.action === 'DELETED' ? 'Meta Removida' :
                                     'Recuperada'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {format(parseISO(entry.timestamp), 'dd/MM/yyyy HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-700 leading-snug">{entry.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="goals"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="h-full overflow-y-auto p-6 space-y-3"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
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
  // Use a local state for the active tab ID. 
  // We initialize it to the first category ID available.
  const [activeSubTab, setActiveSubTab] = useState<CategoryId>('');

  // Sync activeSubTab if it's empty or points to a non-existent category
  // This effect ensures that if categories change (add/delete), we stay on a valid category.
  useEffect(() => {
    const isValid = categories.some(c => c.id === activeSubTab);
    if (!isValid && categories.length > 0) {
      setActiveSubTab(categories[0].id);
    } else if (!activeSubTab && categories.length > 0) {
      setActiveSubTab(categories[0].id);
    }
  }, [categories, activeSubTab]);

  // Derive the active category object from the list
  const activeCategory = useMemo(() => {
    return categories.find(c => c.id === activeSubTab) || categories[0];
  }, [categories, activeSubTab]);

  // Filter athletes based on the current selection
  const filteredAthletes = useMemo(() => {
    const targetId = activeCategory?.id || activeSubTab;
    return athletes.filter(a => a.categoryId === targetId && a.status === 'ATIVO');
  }, [athletes, activeSubTab, activeCategory]);

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
        
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveSubTab(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-2",
                activeSubTab === cat.id 
                  ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20 scale-105 z-10" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-brand-200 hover:text-brand-500"
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
  const [selectedDaySessions, setSelectedDaySessions] = useState<{ day: Date, sessions: TrainingSession[] } | null>(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const calendarDaysArray = calendarDays;

  const getTrainingSessionsForDay = (day: Date) => {
    const dayIndex = getDay(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    
    return sessions.filter(s => {
      if (s.type === 'RECURRING') {
        return s.daysOfWeek?.includes(dayIndex);
      } else if (s.type === 'PERSONALIZED' && s.date) {
        return s.date === dateStr;
      }
      return false;
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
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
            const daySessions = getTrainingSessionsForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasSessions = daySessions.length > 0;
            const primaryCat = hasSessions ? categories.find(c => c.id === daySessions[0].categoryId) : null;
            
            return (
              <div 
                key={i} 
                onClick={() => {
                  if (hasSessions && isCurrentMonth) {
                    setSelectedDaySessions({ day, sessions: daySessions });
                  } else {
                    setSelectedDaySessions(null);
                  }
                }}
                className={cn(
                  "h-8 flex flex-col items-center justify-center text-xs font-bold rounded-lg relative transition-all",
                  !isCurrentMonth ? "text-gray-200" : "text-gray-600 hover:bg-gray-50",
                  hasSessions && isCurrentMonth ? "bg-gray-50 cursor-pointer hover:shadow-sm" : "",
                  isToday && "ring-2 ring-brand-500 ring-offset-1 z-10",
                  selectedDaySessions?.day && isSameDay(day, selectedDaySessions.day) && "bg-brand-50 text-brand-600 ring-1 ring-brand-200"
                )}
              >
                {format(day, 'd')}
                {hasSessions && isCurrentMonth && (
                  <div className="flex gap-0.5 mt-0.5">
                    {daySessions.slice(0, 3).map((s, idx) => {
                      const cat = categories.find(c => c.id === s.categoryId);
                      return (
                        <div 
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: cat?.color || '#007FFF' }}
                        />
                      );
                    })}
                  </div>
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

      <AnimatePresence>
        {selectedDaySessions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white p-5 rounded-2xl shadow-lg border border-brand-100 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest leading-none mb-1">
                  {format(selectedDaySessions.day, 'EEEE', { locale: ptBR })}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {format(selectedDaySessions.day, "d 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <button 
                onClick={() => setSelectedDaySessions(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={14} className="rotate-45" /> 
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedDaySessions.sessions.map((session, idx) => {
                const cat = categories.find(c => c.id === session.categoryId);
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#D1D5DB' }} />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-gray-400 mb-0.5">
                        {session.startTime} - {session.endTime}
                      </div>
                      <div className="text-xs font-bold text-gray-800 leading-snug">
                        {session.description || 'Treino s/ descrição'}
                      </div>
                      {cat && (
                        <div className="text-[8px] font-black text-brand-600 uppercase tracking-tighter mt-1">
                          {cat.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

  const handleExportSessions = () => {
    const headers = ["Tipo", "Dias/Data", "Inicio", "Fim", "Categoria", "Descrição"];
    const rows = sessions.map(s => {
      const cat = categories.find(c => c.id === s.categoryId);
      const timeInfo = s.type === 'RECURRING' 
        ? s.daysOfWeek?.map(d => days[d]).join(', ')
        : s.date;
        
      return [
        s.type,
        timeInfo,
        s.startTime,
        s.endTime,
        cat?.name || 'Geral',
        s.description || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(';');
    });
    
    const csvContent = [headers.join(';'), ...rows].join('\n');
    downloadCSV(csvContent, 'agenda_treinos_atletapro.csv');
  };

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
        <div className="flex gap-2">
          <button
            onClick={handleExportSessions}
            title="Exportar Agenda (.CSV)"
            className="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-brand-600 hover:bg-gray-50 transition-all"
          >
            <Download size={20} />
          </button>
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
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Calendar Grid */}
        <div className="flex-1 space-y-6">
          {/* Legenda Dinâmica */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 pr-4 mr-0">
              Legenda
            </div>
            <div className="flex flex-wrap gap-4">
              {categories.map(cat => {
                const count = sessions.filter(s => s.categoryId === cat.id).length;
                if (count === 0) return null;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{cat.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({count})</span>
                  </div>
                );
              })}
              {sessions.filter(s => !s.categoryId).length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 shadow-sm" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">Sem Categoria</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day, idx) => {
              const isToday = new Date().getDay() === idx;
              return (
                <div 
                  key={day} 
                  className={cn(
                    "bg-white rounded-2xl shadow-sm overflow-hidden border flex flex-col min-h-[400px] transition-all",
                    isToday ? "border-brand-500 ring-2 ring-brand-500/10 shadow-lg" : "border-gray-100"
                  )}
                >
                  <div className={cn(
                    "p-3 text-center border-b font-black text-[10px] uppercase tracking-widest flex flex-col gap-0.5",
                    isToday ? "bg-brand-500 text-white border-brand-600" : (idx === 0 || idx === 6 ? "text-red-400 bg-red-50/30 border-gray-50" : "text-gray-400 bg-gray-50/30 border-gray-50")
                  )}>
                    {day}
                    {isToday && <span className="text-[8px] opacity-80">(Hoje)</span>}
                  </div>
                  <div className="flex-1 p-3 space-y-3">
                    {getSessionsForDay(idx).length === 0 ? (
                      <div className="h-full flex items-center justify-center italic text-[10px] text-gray-300 text-center px-4 leading-relaxed">
                        Nenhum treino agendado
                      </div>
                    ) : getSessionsForDay(idx).map(session => {
                      const cat = categories.find(c => c.id === session.categoryId);
                      return (
                        <div 
                          key={session.id} 
                          className="p-3 rounded-xl border-l-4 group relative transition-all hover:translate-x-1 shadow-sm"
                          style={{ 
                            backgroundColor: cat?.color ? `${cat.color}10` : '#F9FAFB',
                            borderColor: cat?.color || '#D1D5DB',
                            borderTopColor: '#F3F4F6',
                            borderRightColor: '#F3F4F6',
                            borderBottomColor: '#F3F4F6'
                          }}
                        >
                          {!isReadOnly && (
                            <button 
                              onClick={() => onDeleteSession(session.id)}
                              className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all bg-white/80 rounded-lg shadow-sm"
                              style={{ color: cat?.color || '#3B82F6' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                          <div 
                            className="text-[9px] font-black mb-1 flex items-center gap-1.5"
                            style={{ color: cat?.color || '#6B7280' }}
                          >
                            <Calendar size={10} />
                            {session.startTime} - {session.endTime}
                          </div>
                          <div className="text-xs font-bold text-gray-800 leading-snug">{session.description || cat?.name}</div>
                          {cat && (
                            <div 
                              className="mt-1.5 text-[8px] font-black uppercase tracking-widest inline-block px-1.5 py-0.5 rounded bg-white/50 border border-gray-100 shadow-sm"
                              style={{ color: cat?.color || '#3B82F6' }}
                            >
                              {cat.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
