import { useState, useEffect } from "react";
import { 
  Users, BarChart3, CreditCard, Activity, Search, 
  MoreVertical, Shield, Ban, Check, TrendingUp,
  DollarSign, UserPlus, Calendar, Filter, Download,
  RefreshCw, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: unknown;
  created_at: string;
  user_email?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  premiumUsers: number;
  newUsersThisMonth: number;
  revenue: number;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    proUsers: 0,
    premiumUsers: 0,
    newUsersThisMonth: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with subscriptions
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

      // Combine data
      const combinedUsers: UserData[] = (profilesData || []).map((profile) => {
        const subscription = subscriptionsData?.find(s => s.user_id === profile.user_id);
        const roles = rolesData?.filter(r => r.user_id === profile.user_id) || [];
        const userStats = statsData?.find(s => s.user_id === profile.user_id);

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
        };
      });

      setUsers(combinedUsers);

      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalUsers: combinedUsers.length,
        activeUsers: combinedUsers.filter(u => u.status === "active").length,
        proUsers: combinedUsers.filter(u => u.plan === "pro").length,
        premiumUsers: combinedUsers.filter(u => u.plan === "premium").length,
        newUsersThisMonth: combinedUsers.filter(u => new Date(u.created_at) >= thisMonth).length,
        revenue: combinedUsers.filter(u => u.plan === "pro").length * 29.90 + 
                 combinedUsers.filter(u => u.plan === "premium").length * 59.90,
      });

      // Fetch activity logs
      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setLogs(logsData || []);

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
        .update({ plan: newPlan })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`Plano atualizado para ${newPlan.toUpperCase()}`);
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar plano");
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
    return matchesSearch && matchesPlan;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const getPlanBadge = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "premium":
        return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">Premium</Badge>;
      case "pro":
        return <Badge className="bg-primary">Pro</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30">Ativo</Badge>;
      case "canceled":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Cancelado</Badge>;
      case "expired":
        return <Badge className="bg-muted text-muted-foreground">Expirado</Badge>;
      case "trial":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
    }
  };

  const StatCard = ({ icon: Icon, label, value, trend, color }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number;
    trend?: string;
    color: string;
  }) => (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs lg:text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 lg:p-6 xl:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie usuários, assinaturas e monitore a plataforma
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" className="border-[hsl(220,15%,20%)]">
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
          <StatCard 
            icon={Users} 
            label="Total de Usuários" 
            value={stats.totalUsers}
            color="bg-primary/20 text-primary"
          />
          <StatCard 
            icon={Activity} 
            label="Usuários Ativos" 
            value={stats.activeUsers}
            color="bg-success/20 text-success"
          />
          <StatCard 
            icon={CreditCard} 
            label="Plano Pro" 
            value={stats.proUsers}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard 
            icon={CreditCard} 
            label="Plano Premium" 
            value={stats.premiumUsers}
            color="bg-amber-500/20 text-amber-400"
          />
          <StatCard 
            icon={UserPlus} 
            label="Novos (Mês)" 
            value={stats.newUsersThisMonth}
            trend="+12% vs mês anterior"
            color="bg-purple-500/20 text-purple-400"
          />
          <StatCard 
            icon={DollarSign} 
            label="Receita Mensal" 
            value={`R$ ${stats.revenue.toFixed(2)}`}
            color="bg-gold/20 text-gold"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-primary">
              <CreditCard className="w-4 h-4 mr-2" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary">
              <Activity className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Métricas
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)]"
                />
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-[hsl(220,15%,20%)]">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Users Table */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(220,15%,15%)] bg-[hsl(220,15%,6%)]">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Cadastro</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Mãos</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(220,15%,12%)]">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[hsl(220,15%,10%)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm flex items-center gap-2">
                                {user.full_name || "Sem nome"}
                                {user.is_admin && (
                                  <Shield className="w-3.5 h-3.5 text-primary" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{getPlanBadge(user.plan)}</td>
                        <td className="p-4">{getStatusBadge(user.status)}</td>
                        <td className="p-4 hidden md:table-cell">
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <p className="text-sm font-mono text-foreground">{user.total_hands}</p>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[hsl(220,15%,10%)] border-[hsl(220,15%,20%)]">
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "pro")}>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Upgrade para Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "premium")}>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Upgrade para Premium
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.is_admin)}>
                                <Shield className="w-4 h-4 mr-2" />
                                {user.is_admin ? "Remover Admin" : "Tornar Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="w-4 h-4 mr-2" />
                                Bloquear Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[hsl(220,15%,15%)]">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * usersPerPage + 1} a{" "}
                    {Math.min(currentPage * usersPerPage, filteredUsers.length)} de{" "}
                    {filteredUsers.length} usuários
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-[hsl(220,15%,20%)]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-[hsl(220,15%,20%)]"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Plan breakdown */}
              {["free", "pro", "premium"].map((plan) => {
                const count = users.filter(u => u.plan === plan).length;
                const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(1) : 0;
                
                return (
                  <div key={plan} className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground capitalize">{plan}</h3>
                      {getPlanBadge(plan as SubscriptionPlan)}
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">{count}</p>
                    <p className="text-sm text-muted-foreground">{percentage}% dos usuários</p>
                    <div className="mt-4 h-2 rounded-full bg-[hsl(220,15%,15%)] overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          plan === "premium" ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                          plan === "pro" ? "bg-primary" : "bg-muted-foreground"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {logs.length > 0 ? (
                  <div className="divide-y divide-[hsl(220,15%,12%)]">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-[hsl(220,15%,10%)] transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.action}</p>
                            {log.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {JSON.stringify(log.details)}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhum log de atividade ainda</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Uso da Plataforma
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Mãos Analisadas", value: users.reduce((acc, u) => acc + u.total_hands, 0) },
                    { label: "Usuários Ativos Hoje", value: Math.floor(stats.activeUsers * 0.3) },
                    { label: "Taxa de Conversão", value: `${stats.totalUsers > 0 ? (((stats.proUsers + stats.premiumUsers) / stats.totalUsers) * 100).toFixed(1) : 0}%` },
                  ].map(metric => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                      <span className="text-lg font-mono font-bold text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gold" />
                  Receita
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">MRR (Receita Mensal)</span>
                    <span className="text-lg font-mono font-bold text-foreground">R$ {stats.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ARR (Receita Anual)</span>
                    <span className="text-lg font-mono font-bold text-foreground">R$ {(stats.revenue * 12).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ticket Médio</span>
                    <span className="text-lg font-mono font-bold text-foreground">
                      R$ {(stats.proUsers + stats.premiumUsers) > 0 
                        ? (stats.revenue / (stats.proUsers + stats.premiumUsers)).toFixed(2) 
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-[hsl(220,18%,8%)] border-[hsl(220,15%,15%)] max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                    {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{selectedUser.full_name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[hsl(220,15%,10%)]">
                    <p className="text-xs text-muted-foreground mb-1">Plano</p>
                    {getPlanBadge(selectedUser.plan)}
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(220,15%,10%)]">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(220,15%,10%)]">
                    <p className="text-xs text-muted-foreground mb-1">Mãos Analisadas</p>
                    <p className="font-mono font-bold text-foreground">{selectedUser.total_hands}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(220,15%,10%)]">
                    <p className="text-xs text-muted-foreground mb-1">Cadastro</p>
                    <p className="text-sm text-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-[hsl(220,15%,20%)]" onClick={() => handleUpdatePlan(selectedUser.id, "pro")}>
                    Upgrade Pro
                  </Button>
                  <Button variant="gold" className="flex-1" onClick={() => handleUpdatePlan(selectedUser.id, "premium")}>
                    Upgrade Premium
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
