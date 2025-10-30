import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as Sentry from "@sentry/react";

export default function SentryTest() {
  const testError = () => {
    throw new Error("🧪 Teste do Sentry - Erro intencional para validação");
  };

  const testCaptureMessage = () => {
    Sentry.captureMessage("📝 Mensagem de teste do Sentry", "info");
    alert("Mensagem enviada ao Sentry! Verifique o dashboard em sentry.io");
  };

  const testCaptureException = () => {
    try {
      // Simular erro de null reference
      const obj: any = null;
      obj.propriedade.inexistente();
    } catch (error) {
      Sentry.captureException(error);
      alert("Exceção capturada e enviada ao Sentry! Verifique o dashboard.");
    }
  };

  const testNetworkError = async () => {
    try {
      await fetch('https://api-inexistente-12345.com/endpoint');
    } catch (error) {
      Sentry.captureException(error);
      alert("Erro de rede capturado! Verifique o dashboard.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Testes do Sentry
          </h1>
          <p className="text-gray-600">
            Use os botões abaixo para testar se o Sentry está capturando erros corretamente.
          </p>
        </div>
        
        <div className="grid gap-4">
          <Card className="p-6 border-2 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">💥</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Teste 1: Erro Fatal
                </h2>
                <p className="text-gray-600 mb-4">
                  Dispara um erro que quebra a aplicação e mostra o ErrorBoundary.
                  O erro será capturado e enviado ao Sentry automaticamente.
                </p>
                <Button onClick={testError} variant="destructive" size="lg">
                  💥 Disparar Erro Fatal
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">📝</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Teste 2: Mensagem Informativa
                </h2>
                <p className="text-gray-600 mb-4">
                  Envia uma mensagem informativa ao Sentry sem quebrar a aplicação.
                  Útil para logs e debugging.
                </p>
                <Button onClick={testCaptureMessage} size="lg">
                  📝 Enviar Mensagem
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-orange-200 bg-orange-50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Teste 3: Exceção Capturada
                </h2>
                <p className="text-gray-600 mb-4">
                  Captura uma exceção manualmente com try/catch e envia ao Sentry.
                  A aplicação continua funcionando normalmente.
                </p>
                <Button onClick={testCaptureException} variant="outline" size="lg">
                  ⚠️ Capturar Exceção
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-purple-200 bg-purple-50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">🌐</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Teste 4: Erro de Rede
                </h2>
                <p className="text-gray-600 mb-4">
                  Simula um erro de requisição HTTP (API inexistente).
                  Útil para testar captura de erros de integração.
                </p>
                <Button onClick={testNetworkError} variant="outline" size="lg">
                  🌐 Simular Erro de Rede
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 Como verificar os erros
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Acesse: <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">https://sentry.io</a></li>
            <li>Faça login na sua conta</li>
            <li>Clique no projeto "STRATEVO"</li>
            <li>Veja os erros capturados em tempo real</li>
            <li>Clique em um erro para ver detalhes completos</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
