import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, BarChart3, CreditCard, Activity, Search, 
  MoreVertical, Shield, Ban, Check, TrendingUp,
  DollarSign, UserPlus, Calendar, Filter, Download,
  RefreshCw, ChevronLeft, ChevronRight, Eye, Edit,
  Mail, Clock, Zap, Crown, Star, Settings, Trash2,
  UserCheck, UserX, AlertCircle, CheckCircle2, XCircle,
  ArrowLeft, LayoutDashboard, Home, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type SubscriptionPlan = "free" | "pro" | "premium";
type SubscriptionStatus = "active" | "canceled" | "expired" | "trial";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  is_admin: boolean;
  last_activity: string | null;
  total_hands: number;
  total_ai_consultations: number;
  daily_usage_count: number;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: unknown;
  created_at: string;
  ip_address?: string;
  user_email?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  premiumUsers: number;
  freeUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  revenue: number;
  totalHands: number;
  totalAIConsultations: number;
}

const COLORS = ['hsl(var(--muted-foreground))', 'hsl(var(--primary))', 'hsl(220, 60%, 60%)'];

export default function Admin() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { resetUserUsage, resetAllUsage } = useUsageLimits();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useAdminNotifications();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    proUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    newUsersThisMonth: 0,
    newUsersThisWeek: 0,
    revenue: 0,
    totalHands: 0,
    totalAIConsultations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const usersPerPage = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch subscriptions
      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select("*");

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("*");

      // Fetch user statistics
      const { data: statsData } = await supabase
        .from("user_statistics")
        .select("*");

      // Fetch daily usage
      const { data: usageData } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("usage_date", new Date().toISOString().split("T")[0]);

      // Combine data
      const combinedUsers: UserData[] = (profilesData || []).map((profile) => {
        const subscription = subscriptionsData?.find(s => s.user_id === profile.user_id);
        const roles = rolesData?.filter(r => r.user_id === profile.user_id) || [];
        const userStats = statsData?.find(s => s.user_id === profile.user_id);
        const dailyUsage = usageData?.find(u => u.user_id === profile.user_id);

        return {
          id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          plan: (subscription?.plan || "free") as SubscriptionPlan,
          status: (subscription?.status || "active") as SubscriptionStatus,
          is_admin: roles.some(r => r.role === "admin"),
          last_activity: userStats?.last_activity_at || null,
          total_hands: userStats?.total_hands_analyzed || 0,
          total_ai_consultations: userStats?.total_ai_consultations || 0,
          daily_usage_count: dailyUsage?.analysis_count || 0,
        };
      });

      setUsers(combinedUsers);

      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now);
      thisWeek.setDate(thisWeek.getDate() - 7);

      const totalHands = combinedUsers.reduce((acc, u) => acc + u.total_hands, 0);
      const totalAI = combinedUsers.reduce((acc, u) => acc + u.total_ai_consultations, 0);

      setStats({
        totalUsers: combinedUsers.length,
        activeUsers: combinedUsers.filter(u => u.status === "active").length,
        proUsers: combinedUsers.filter(u => u.plan === "pro").length,
        premiumUsers: combinedUsers.filter(u => u.plan === "premium").length,
        freeUsers: combinedUsers.filter(u => u.plan === "free").length,
        newUsersThisMonth: combinedUsers.filter(u => new Date(u.created_at) >= thisMonth).length,
        newUsersThisWeek: combinedUsers.filter(u => new Date(u.created_at) >= thisWeek).length,
        revenue: combinedUsers.filter(u => u.plan === "pro").length * 29.90 + 
                 combinedUsers.filter(u => u.plan === "premium").length * 59.90,
        totalHands,
        totalAIConsultations: totalAI,
      });

      // Fetch activity logs
      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      // Enrich logs with user emails
      const enrichedLogs = (logsData || []).map(log => {
        const userProfile = profilesData?.find(p => p.user_id === log.user_id);
        return {
          ...log,
          user_email: userProfile?.email,
        };
      });

      setLogs(enrichedLogs);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlan = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: currentUser?.id,
        action: "plan_updated",
        details: { target_user: userId, new_plan: newPlan },
      });

      toast.success(`Plano atualizado para ${newPlan.toUpperCase()}`);
      fetchData();
      setEditingUser(null);
    } catch (error) {
      toast.error("Erro ao atualizar plano");
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: SubscriptionStatus) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`Status atualizado para ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      }

      await supabase.from("activity_logs").insert({
        user_id: currentUser?.id,
        action: isCurrentlyAdmin ? "admin_removed" : "admin_added",
        details: { target_user: userId },
      });

      toast.success(isCurrentlyAdmin ? "Admin removido" : "Admin adicionado");
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar permissões");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlan = planFilter === "all" || user.plan === planFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const getPlanBadge = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "premium":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black gap-1">
            <Crown className="w-3 h-3" />
            Premium
          </Badge>
        );
      case "pro":
        return (
          <Badge className="bg-primary gap-1">
            <Star className="w-3 h-3" />
            Pro
          </Badge>
        );
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ativo
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <XCircle className="w-3 h-3" />
            Cancelado
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-muted text-muted-foreground gap-1">
            <AlertCircle className="w-3 h-3" />
            Expirado
          </Badge>
        );
      case "trial":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
            <Clock className="w-3 h-3" />
            Trial
          </Badge>
        );
    }
  };

  // Chart data
  const planDistribution = [
    { name: 'Free', value: stats.freeUsers, fill: 'hsl(var(--muted-foreground))' },
    { name: 'Pro', value: stats.proUsers, fill: 'hsl(var(--primary))' },
    { name: 'Premium', value: stats.premiumUsers, fill: 'hsl(45, 93%, 47%)' },
  ];

  const revenueData = [
    { month: 'Jan', value: stats.revenue * 0.7 },
    { month: 'Fev', value: stats.revenue * 0.8 },
    { month: 'Mar', value: stats.revenue * 0.85 },
    { month: 'Abr', value: stats.revenue * 0.9 },
    { month: 'Mai', value: stats.revenue * 0.95 },
    { month: 'Jun', value: stats.revenue },
  ];

  const StatCard = ({ icon: Icon, label, value, subValue, trend, color, className }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number;
    subValue?: string;
    trend?: string;
    color: string;
    className?: string;
  }) => (
    <div className={cn(
      "rounded-xl bg-card border border-border p-4 lg:p-5 transition-all hover:border-primary/30",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs lg:text-sm text-muted-foreground mb-1 truncate">{label}</p>
          <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
          )}
          {trend && (
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-2 lg:p-2.5 rounded-lg flex-shrink-0", color)}>
          <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Painel Admin
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border-border gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 lg:gap-3">
                <Shield className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                Painel Admin
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Gerencie usuários, assinaturas e monitore métricas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <AdminNotifications
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClear={clearNotifications}
            />
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="sm"
              className="border-border"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary text-xs sm:text-sm">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-primary text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Assinaturas</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary text-xs sm:text-sm">
              <Activity className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 lg:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
              <StatCard 
                icon={Users} 
                label="Total Usuários" 
                value={stats.totalUsers}
                color="bg-primary/20 text-primary"
              />
              <StatCard 
                icon={UserCheck} 
                label="Ativos" 
                value={stats.activeUsers}
                subValue={`${((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(0)}%`}
                color="bg-success/20 text-success"
              />
              <StatCard 
                icon={Star} 
                label="Pro" 
                value={stats.proUsers}
                color="bg-primary/20 text-primary"
              />
              <StatCard 
                icon={Crown} 
                label="Premium" 
                value={stats.premiumUsers}
                color="bg-amber-500/20 text-amber-400"
              />
              <StatCard 
                icon={UserPlus} 
                label="Novos (Semana)" 
                value={stats.newUsersThisWeek}
                trend={stats.newUsersThisWeek > 0 ? "+novo" : undefined}
                color="bg-purple-500/20 text-purple-400"
              />
              <StatCard 
                icon={DollarSign} 
                label="MRR" 
                value={`R$ ${stats.revenue.toFixed(0)}`}
                subValue={`ARR: R$ ${(stats.revenue * 12).toFixed(0)}`}
                color="bg-gold/20 text-gold"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Chart */}
              <div className="rounded-xl bg-card border border-border p-4 lg:p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Evolução da Receita
                </h3>
                <div className="h-48 lg:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plan Distribution */}
              <div className="rounded-xl bg-card border border-border p-4 lg:p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Distribuição de Planos
                </h3>
                <div className="h-48 lg:h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {planDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-card border border-border p-4 lg:p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Uso da Plataforma
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mãos Analisadas</span>
                    <span className="font-mono font-bold text-foreground">{stats.totalHands.toLocaleString()}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consultas IA</span>
                    <span className="font-mono font-bold text-foreground">{stats.totalAIConsultations.toLocaleString()}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa Conversão</span>
                    <span className="font-mono font-bold text-success">
                      {stats.totalUsers > 0 
                        ? `${(((stats.proUsers + stats.premiumUsers) / stats.totalUsers) * 100).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border p-4 lg:p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gold" />
                  Métricas Financeiras
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Receita Pro</span>
                    <span className="font-mono font-bold text-foreground">R$ {(stats.proUsers * 29.90).toFixed(2)}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Receita Premium</span>
                    <span className="font-mono font-bold text-foreground">R$ {(stats.premiumUsers * 59.90).toFixed(2)}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ticket Médio</span>
                    <span className="font-mono font-bold text-foreground">
                      R$ {(stats.proUsers + stats.premiumUsers) > 0 
                        ? (stats.revenue / (stats.proUsers + stats.premiumUsers)).toFixed(2) 
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border p-4 lg:p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  Crescimento
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Novos (Mês)</span>
                    <span className="font-mono font-bold text-foreground">{stats.newUsersThisMonth}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Novos (Semana)</span>
                    <span className="font-mono font-bold text-foreground">{stats.newUsersThisWeek}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Churn Rate</span>
                    <span className="font-mono font-bold text-destructive">
                      {stats.totalUsers > 0 
                        ? `${((users.filter(u => u.status === "canceled").length / stats.totalUsers) * 100).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <div className="flex gap-2">
                <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-28 sm:w-32 bg-card border-border">
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-28 sm:w-32 bg-card border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    await resetAllUsage();
                    fetchData();
                  }}
                  className="border-border gap-2 whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Resetar Todos</span>
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Usuário</TableHead>
                      <TableHead className="font-semibold">Plano</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">Status</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Uso Hoje</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Cadastro</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm flex items-center gap-1.5 truncate">
                                {user.full_name || "Sem nome"}
                                {user.is_admin && (
                                  <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(user.plan)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-sm">
                            {user.daily_usage_count}/5
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border w-48">
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Plano
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "pro")}>
                                <Star className="w-4 h-4 mr-2" />
                                Upgrade Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "premium")}>
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade Premium
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.is_admin)}>
                                <Shield className="w-4 h-4 mr-2" />
                                {user.is_admin ? "Remover Admin" : "Tornar Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={async () => {
                                  await resetUserUsage(user.id);
                                  fetchData();
                                }}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Resetar Créditos
                              </DropdownMenuItem>
                              {user.status === "active" ? (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(user.id, "canceled")}
                                  className="text-destructive"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, "active")}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Reativar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-t border-border gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {(currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} de {filteredUsers.length}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-border h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn("h-8 w-8 p-0", currentPage !== page && "border-border")}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-border h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {[
                { plan: "free" as const, price: "R$ 0", color: "from-muted to-muted-foreground" },
                { plan: "pro" as const, price: "R$ 29,90/mês", color: "from-primary to-primary/80" },
                { plan: "premium" as const, price: "R$ 59,90/mês", color: "from-amber-500 to-yellow-500" },
              ].map(({ plan, price, color }) => {
                const count = users.filter(u => u.plan === plan).length;
                const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(1) : 0;
                
                return (
                  <div key={plan} className="rounded-xl bg-card border border-border p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground capitalize text-lg">{plan}</h3>
                        <p className="text-xs text-muted-foreground">{price}</p>
                      </div>
                      {getPlanBadge(plan)}
                    </div>
                    <p className="text-3xl lg:text-4xl font-bold text-foreground mb-1">{count}</p>
                    <p className="text-sm text-muted-foreground">{percentage}% dos usuários</p>
                    <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full bg-gradient-to-r", color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {plan !== "free" && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Receita: <span className="font-mono text-foreground font-semibold">
                          R$ {(count * (plan === "pro" ? 29.90 : 59.90)).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent Upgrades */}
            <div className="rounded-xl bg-card border border-border p-4 lg:p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Usuários Pagantes
              </h3>
              <div className="space-y-2">
                {users.filter(u => u.plan !== "free").slice(0, 10).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {getPlanBadge(user.plan)}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <ScrollArea className="h-[500px] lg:h-[600px]">
                {logs.length > 0 ? (
                  <div className="divide-y divide-border">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 lg:p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                              {log.user_email && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {log.user_email}
                                </span>
                              )}
                            </div>
                            {log.details && (
                              <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                {JSON.stringify(log.details)}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhum log de atividade</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes do Usuário
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                    {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg flex items-center gap-2">
                      {selectedUser.full_name || "Sem nome"}
                      {selectedUser.is_admin && <Shield className="w-4 h-4 text-primary" />}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Plano</p>
                    {getPlanBadge(selectedUser.plan)}
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Mãos Analisadas</p>
                    <p className="font-mono font-bold text-foreground">{selectedUser.total_hands}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Consultas IA</p>
                    <p className="font-mono font-bold text-foreground">{selectedUser.total_ai_consultations}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Uso Hoje</p>
                    <p className="font-mono font-bold text-foreground">{selectedUser.daily_usage_count}/5</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Cadastro</p>
                    <p className="text-sm text-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleToggleAdmin(selectedUser.id, selectedUser.is_admin)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {selectedUser.is_admin ? "Remover Admin" : "Tornar Admin"}
                  </Button>
                  <Button 
                    variant="gold" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(null);
                      setEditingUser(selectedUser);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Plano
              </DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {editingUser.full_name?.charAt(0) || editingUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{editingUser.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{editingUser.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Plano Atual</p>
                  {getPlanBadge(editingUser.plan)}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Alterar para:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={editingUser.plan === "free" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdatePlan(editingUser.id, "free")}
                      className="w-full"
                    >
                      Free
                    </Button>
                    <Button
                      variant={editingUser.plan === "pro" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdatePlan(editingUser.id, "pro")}
                      className="w-full"
                    >
                      Pro
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => handleUpdatePlan(editingUser.id, "premium")}
                      className="w-full"
                    >
                      Premium
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}