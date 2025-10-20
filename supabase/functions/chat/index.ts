import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    console.log("Iniciando chat con", messages.length, "mensajes");

    const systemPrompt = `Eres un psicólogo profesional y coach de vida especializado en ayudar a las personas a:
- Alcanzar claridad mental y emocional
- Establecer y alcanzar objetivos personales y profesionales
- Organizar su vida y gestionar su tiempo efectivamente
- Desarrollar hábitos saludables y productivos
- Superar obstáculos mentales y emocionales
- Tomar decisiones importantes con confianza

Tu enfoque es:
- Empático y compasivo, pero también directo cuando es necesario
- Basado en técnicas de psicología cognitivo-conductual y coaching de vida
- Orientado a la acción con pasos concretos y alcanzables
- Positivo pero realista
- Respetuoso de los límites éticos y profesionales

Siempre:
- Escucha activamente y valida las emociones
- Haz preguntas reflexivas que ayuden a la introspección
- Ofrece herramientas y técnicas prácticas
- Anima a la autorreflexión y el crecimiento personal
- Mantén la confidencialidad y respeto
- Si detectas situaciones que requieren atención médica urgente, recomienda buscar ayuda profesional presencial

Responde de manera natural, cálida y profesional en español.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Por favor intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere añadir créditos a tu cuenta de Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("Error del gateway de IA:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con el servicio de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Error en chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
