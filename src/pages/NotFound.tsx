import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "Erro 404: tentativa de acesso a rota inexistente:",
      location.pathname
    );
    document.title = "Página não encontrada - DeliveryFácil";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Página não encontrada</p>
        <a href="/" className="text-primary underline hover:opacity-90">
          Voltar para a página inicial
        </a>
      </div>
    </div>
  );
};

export default NotFound;
