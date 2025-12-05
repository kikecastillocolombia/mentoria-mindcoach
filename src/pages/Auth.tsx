import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 shadow-medium">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            MentorIA
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu acompañante en el camino hacia el bienestar
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-medium p-8 border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(177, 56%, 48%)",
                    brandAccent: "hsl(177, 56%, 42%)",
                    inputBackground: "hsl(210, 20%, 98%)",
                    inputText: "hsl(210, 15%, 15%)",
                    inputBorder: "hsl(210, 20%, 90%)",
                    inputBorderFocus: "hsl(177, 56%, 48%)",
                    inputBorderHover: "hsl(177, 56%, 48%)",
                  },
                  borderWidths: {
                    buttonBorderWidth: "1px",
                    inputBorderWidth: "1px",
                  },
                  radii: {
                    borderRadiusButton: "0.75rem",
                    buttonBorderRadius: "0.75rem",
                    inputBorderRadius: "0.75rem",
                  },
                },
              },
              className: {
                container: "space-y-4",
                button: "transition-all duration-300 hover:shadow-soft",
                input: "transition-all duration-300",
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Correo electrónico",
                  password_label: "Contraseña",
                  button_label: "Iniciar sesión",
                  loading_button_label: "Iniciando sesión...",
                  social_provider_text: "Continuar con {{provider}}",
                  link_text: "¿Ya tienes cuenta? Inicia sesión",
                  email_input_placeholder: "tu@email.com",
                  password_input_placeholder: "Tu contraseña",
                },
                sign_up: {
                  email_label: "Correo electrónico",
                  password_label: "Contraseña",
                  button_label: "Crear cuenta",
                  loading_button_label: "Creando cuenta...",
                  social_provider_text: "Continuar con {{provider}}",
                  link_text: "¿No tienes cuenta? Regístrate",
                  email_input_placeholder: "tu@email.com",
                  password_input_placeholder: "Crea una contraseña",
                },
                forgotten_password: {
                  link_text: "¿Olvidaste tu contraseña?",
                  button_label: "Enviar instrucciones",
                  loading_button_label: "Enviando instrucciones...",
                  email_label: "Correo electrónico",
                  email_input_placeholder: "tu@email.com",
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6 animate-in fade-in duration-700 delay-300">
          Al continuar, aceptas nuestros términos y política de privacidad
        </p>
      </div>
    </div>
  );
};

export default Auth;
