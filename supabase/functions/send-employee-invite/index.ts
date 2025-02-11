
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeName, employeeEmail, companyName } = await req.json();

    console.log(`Sending invite email to ${employeeEmail}`);

    const emailResponse = await resend.emails.send({
      from: "TreinePass <onboarding@resend.dev>",
      to: [employeeEmail],
      subject: "Convite para TreinePass",
      html: `
        <h1>Olá ${employeeName}!</h1>
        <p>Você foi convidado(a) pela empresa ${companyName} para acessar o TreinePass.</p>
        <p>Para começar a usar seu benefício, clique no link abaixo:</p>
        <a href="https://app.treinepass.com.br/register?email=${employeeEmail}" style="background-color: #0125F0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
          Ativar minha conta
        </a>
        <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
        <p>Atenciosamente,<br>Equipe TreinePass</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
