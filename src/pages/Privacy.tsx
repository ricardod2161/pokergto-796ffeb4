import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Database, Lock, Bell, Globe, UserCheck, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Privacy() {
  const lastUpdated = "25 de Janeiro de 2026";

  const sections = [
    {
      icon: Eye,
      title: "1. Informações que Coletamos",
      content: `Coletamos os seguintes tipos de informações:

DADOS DE CONTA:
• Email e nome completo (registro)
• Senha criptografada
• Preferências de jogo e nível de experiência

DADOS DE USO:
• Histórico de análises realizadas
• Estatísticas de uso da plataforma
• Logs de atividade para segurança

DADOS TÉCNICOS:
• Endereço IP e localização aproximada
• Tipo de navegador e dispositivo
• Cookies essenciais para funcionamento

NÃO coletamos dados financeiros de cartão - isso é gerenciado diretamente pelo Stripe.`
    },
    {
      icon: Database,
      title: "2. Como Usamos suas Informações",
      content: `Utilizamos seus dados para:

PRESTAÇÃO DO SERVIÇO:
• Fornecer análises de poker personalizadas
• Gerenciar sua conta e assinatura
• Melhorar algoritmos de IA baseados em padrões de uso

COMUNICAÇÃO:
• Enviar notificações sobre sua conta
• Informar sobre atualizações do serviço
• Marketing (apenas com consentimento)

SEGURANÇA:
• Detectar fraudes e atividades suspeitas
• Proteger contra acessos não autorizados
• Cumprir obrigações legais`
    },
    {
      icon: Lock,
      title: "3. Segurança dos Dados",
      content: `Implementamos medidas robustas de segurança:

PROTEÇÃO TÉCNICA:
• Criptografia TLS/SSL em todas as transmissões
• Senhas armazenadas com hash bcrypt
• Proteção contra vazamento de senhas (HaveIBeenPwned)
• Row Level Security (RLS) no banco de dados

ACESSO RESTRITO:
• Apenas funcionários autorizados acessam dados
• Logs de auditoria para todas as operações
• Autenticação de dois fatores disponível

INFRAESTRUTURA:
• Servidores seguros com certificações SOC 2
• Backups regulares e recuperação de desastres
• Monitoramento 24/7 de segurança`
    },
    {
      icon: Globe,
      title: "4. Compartilhamento de Dados",
      content: `Compartilhamos dados apenas quando necessário:

PROVEDORES DE SERVIÇO:
• Stripe (processamento de pagamentos)
• Supabase (infraestrutura de banco de dados)
• Google AI (análises de IA - dados anonimizados)

NUNCA vendemos seus dados pessoais.

REQUISITOS LEGAIS:
Podemos divulgar informações quando exigido por lei, ordem judicial ou para proteger nossos direitos legais.

TRANSFERÊNCIAS DE NEGÓCIO:
Em caso de fusão ou aquisição, seus dados podem ser transferidos, mantendo as mesmas proteções.`
    },
    {
      icon: Bell,
      title: "5. Cookies e Rastreamento",
      content: `Utilizamos cookies para:

ESSENCIAIS (sempre ativos):
• Manter sua sessão de login
• Preferências de idioma e tema
• Segurança (CSRF tokens)

FUNCIONAIS:
• Lembrar configurações de análise
• Histórico de cálculos recentes

ANALÍTICOS (com consentimento):
• Entender padrões de uso
• Melhorar a experiência do usuário

Você pode gerenciar cookies nas configurações do seu navegador. Desativar cookies essenciais pode impedir o funcionamento do Serviço.`
    },
    {
      icon: UserCheck,
      title: "6. Seus Direitos (LGPD)",
      content: `De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:

ACESSO: Solicitar cópia de todos os dados que temos sobre você.

CORREÇÃO: Atualizar informações incorretas ou desatualizadas.

EXCLUSÃO: Solicitar remoção de seus dados pessoais.

PORTABILIDADE: Receber seus dados em formato estruturado.

REVOGAÇÃO: Retirar consentimento para marketing a qualquer momento.

OPOSIÇÃO: Contestar o processamento de seus dados.

Para exercer esses direitos, entre em contato pelo email: privacidade@pokergto.pro

Responderemos em até 15 dias úteis.`
    },
    {
      icon: Trash2,
      title: "7. Retenção e Exclusão",
      content: `PERÍODO DE RETENÇÃO:
• Dados de conta: mantidos enquanto a conta estiver ativa
• Logs de atividade: 90 dias
• Dados de pagamento: conforme exigência fiscal (5 anos)

EXCLUSÃO DE CONTA:
Ao solicitar exclusão da conta:
• Dados pessoais removidos em até 30 dias
• Backups purgados em até 90 dias
• Alguns dados podem ser retidos para cumprimento legal

Após cancelamento, seus dados são anonimizados para estatísticas agregadas.`
    },
    {
      icon: Shield,
      title: "8. Menores de Idade",
      content: `Nosso Serviço NÃO é destinado a menores de 18 anos.

Não coletamos intencionalmente dados de menores. Se descobrirmos que coletamos dados de um menor, excluiremos imediatamente.

Se você é pai/responsável e acredita que seu filho nos forneceu dados, entre em contato imediatamente.`
    },
    {
      icon: Globe,
      title: "9. Transferências Internacionais",
      content: `Seus dados podem ser processados em servidores localizados fora do Brasil.

Garantimos que todas as transferências internacionais:
• Utilizam cláusulas contratuais padrão aprovadas
• Cumprem requisitos da LGPD
• Mantêm o mesmo nível de proteção

Principais localizações de processamento:
• Estados Unidos (Supabase, Stripe)
• União Europeia (backups redundantes)`
    },
    {
      icon: Mail,
      title: "10. Contato e Atualizações",
      content: `ENCARREGADO DE PROTEÇÃO DE DADOS (DPO):
Email: privacidade@pokergto.pro
Resposta: até 48 horas úteis

ATUALIZAÇÕES DESTA POLÍTICA:
• Notificaremos sobre mudanças significativas
• Aviso por email com 30 dias de antecedência
• Versões anteriores disponíveis sob solicitação

DÚVIDAS OU RECLAMAÇÕES:
Se não estiver satisfeito com nossa resposta, você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD).`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Início
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Política de Privacidade
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Política de Privacidade</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Última atualização: {lastUpdated}
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                LGPD Compliant
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Dados Criptografados
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Sua privacidade é fundamental para nós. Esta política explica como coletamos, usamos e protegemos 
              suas informações pessoais na PokerGTO Pro.
            </p>

            <Separator />

            {sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                </div>
                <div className="pl-12">
                  <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                    {section.content}
                  </p>
                </div>
                {index < sections.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            <Separator />

            <div className="text-center space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Ao usar a PokerGTO Pro, você confirma que leu e compreendeu esta Política de Privacidade.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link to="/terms">Ver Termos de Uso</Link>
                </Button>
                <Button asChild>
                  <Link to="/dashboard">Ir para Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
