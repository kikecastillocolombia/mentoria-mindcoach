import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Calendar, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary shadow-medium">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              BienesTia
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto">
              Tu acompañante inteligente en el camino hacia una vida más clara, 
              organizada y plena
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Claridad Mental</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra tu dirección con orientación personalizada y reflexiva
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Organización</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona tu tiempo y prioridades de manera efectiva
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Logros</h3>
              <p className="text-sm text-muted-foreground">
                Alcanza tus objetivos con estrategias comprobadas
              </p>
            </div>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-medium transition-all duration-300 text-white px-8 py-6 text-lg rounded-xl"
            >
              Comenzar Ahora
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Inicia tu viaje hacia el bienestar hoy mismo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
