import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  notificationType: string;
  subject: string;
  body: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, notificationType, subject, body, email }: NotificationRequest = await req.json();

    console.log("Sending notification:", { userId, notificationType, subject });

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Ayra <onboarding@resend.dev>",
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
            ${body}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Best regards,<br>
            The Ayra Team
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Record notification in database
    const { error: dbError } = await supabase
      .from("email_notifications")
      .insert({
        user_id: userId,
        notification_type: notificationType,
        subject,
        body,
        sent_at: new Date().toISOString(),
        status: "sent",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
