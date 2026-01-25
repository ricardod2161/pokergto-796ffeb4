import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Scale, AlertTriangle, Users, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Terms() {
  const lastUpdated = "25 de Janeiro de 2026";

  const sections = [
    {
      icon: FileText,
      title: "1. Aceitação dos Termos",
      content: `Ao acessar e utilizar a plataforma PokerGTO Pro ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar o Serviço.

O uso contínuo do Serviço após quaisquer alterações nestes Termos constitui sua aceitação das alterações.`
    },
    {
      icon: Users,
      title: "2. Elegibilidade e Conta",
      content: `Para usar nosso Serviço, você deve:
• Ter pelo menos 18 anos de idade
• Fornecer informações precisas e completas durante o registro
• Manter a segurança de sua conta e senha
• Notificar-nos imediatamente sobre qualquer uso não autorizado

Você é responsável por todas as atividades que ocorrem em sua conta. Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.`
    },
    {
      icon: Scale,
      title: "3. Uso Permitido",
      content: `Você concorda em usar o Serviço apenas para fins legais e de acordo com estes Termos. Você NÃO deve:
• Usar o Serviço para atividades ilegais de jogo
• Compartilhar sua conta com terceiros
• Tentar acessar sistemas não autorizados
• Reproduzir, duplicar ou revender o Serviço
• Usar bots, scrapers ou ferramentas automatizadas
• Interferir na operação do Serviço

O Serviço é uma ferramenta educacional para análise de poker e não garante ganhos financeiros.`
    },
    {
      icon: CreditCard,
      title: "4. Assinaturas e Pagamentos",
      content: `Oferecemos planos gratuitos e pagos:

PLANO GRATUITO: Acesso limitado a 5 análises de IA por dia.

PLANOS PAGOS (Pro e Premium):
• Cobrados mensalmente ou anualmente
• Renovação automática até cancelamento
• Cancelamento a qualquer momento via portal do cliente
• Sem reembolsos para períodos parciais

Os preços podem ser alterados com aviso prévio de 30 dias. Pagamentos são processados de forma segura via Stripe.`
    },
    {
      icon: Shield,
      title: "5. Propriedade Intelectual",
      content: `Todo o conteúdo do Serviço, incluindo mas não limitado a:
• Algoritmos de análise GTO
• Ranges e estratégias
• Interface e design
• Código-fonte e software

É propriedade exclusiva da PokerGTO Pro e protegido por leis de direitos autorais. Você recebe uma licença limitada, não exclusiva e não transferível para uso pessoal.`
    },
    {
      icon: AlertTriangle,
      title: "6. Isenção de Responsabilidade",
      content: `O SERVIÇO É FORNECIDO "COMO ESTÁ" SEM GARANTIAS DE QUALQUER TIPO.

Não garantimos que:
• O Serviço será ininterrupto ou livre de erros
• As análises resultarão em ganhos no poker
• Os resultados serão precisos em todas as situações

O poker envolve risco financeiro. Use o Serviço como ferramenta educacional, não como conselho financeiro. Você é o único responsável por suas decisões de jogo.`
    },
    {
      icon: Scale,
      title: "7. Limitação de Responsabilidade",
      content: `Em nenhuma circunstância seremos responsáveis por:
• Perdas financeiras em jogos de poker
• Danos indiretos, incidentais ou consequenciais
• Perda de dados ou interrupção de negócios
• Qualquer dano superior ao valor pago pelo Serviço nos últimos 12 meses

Algumas jurisdições não permitem certas limitações, portanto algumas das acima podem não se aplicar a você.`
    },
    {
      icon: FileText,
      title: "8. Modificações e Encerramento",
      content: `Reservamo-nos o direito de:
• Modificar ou descontinuar o Serviço a qualquer momento
• Alterar estes Termos com aviso prévio
• Encerrar sua conta por violação dos Termos

Em caso de encerramento por nossa iniciativa sem justa causa, você receberá reembolso proporcional do período não utilizado.`
    },
    {
      icon: Mail,
      title: "9. Contato e Disputas",
      content: `Para questões sobre estes Termos:
• Email: suporte@pokergto.pro
• Resposta em até 48 horas úteis

Disputas serão resolvidas primeiro por negociação amigável. Se não resolvidas em 30 dias, serão submetidas à arbitragem sob as leis do Brasil.

Estes Termos são regidos pelas leis da República Federativa do Brasil.`
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
                <FileText className="w-4 h-4" />
                Termos de Uso
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
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Termos de Uso</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Última atualização: {lastUpdated}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Bem-vindo à PokerGTO Pro. Estes termos regulam o uso de nossa plataforma de análise de poker. 
              Por favor, leia atentamente antes de utilizar nossos serviços.
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
                Ao usar a PokerGTO Pro, você confirma que leu, entendeu e concorda com estes Termos de Uso.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link to="/privacy">Ver Política de Privacidade</Link>
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
