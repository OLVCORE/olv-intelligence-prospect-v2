import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as Sentry from "@sentry/react";

export default function SentryTest() {
  const testError = () => {
    throw new Error("🧪 Teste do Sentry - Erro intencional para validação");
  };

  const testCaptureMessage = () => {
    Sentry.captureMessage("📝 Mensagem de teste do Sentry", "info");
    alert("Mensagem enviada ao Sentry! Verifique o dashboard.");
  };

  const testCaptureException = () => {
    try {
      // Simular erro
      const obj: any = null;
      obj.propriedade.inexistente();
    } catch (error) {
      Sentry.captureException(error);
      alert("Exceção capturada e enviada ao Sentry!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Testes do Sentry</h1>
        
        <div className="grid gap-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Teste 1: Erro Fatal</h2>
            <p className="text-gray-600 mb-4">
              Dispara um erro que quebra a aplicação e mostra o ErrorBoundary.
            </p>
            <Button onClick={testError} variant="destructive">
              Disparar Erro Fatal
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Teste 2: Mensagem</h2>
            <p className="text-gray-600 mb-4">
              Envia uma mensagem informativa ao Sentry sem quebrar a aplicação.
            </p>
            <Button onClick={testCaptureMessage}>
              Enviar Mensagem
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Teste 3: Exceção Capturada</h2>
            <p className="text-gray-600 mb-4">
              Captura uma exceção manualmente e envia ao Sentry.
            </p>
            <Button onClick={testCaptureException} variant="outline">
              Capturar Exceção
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
