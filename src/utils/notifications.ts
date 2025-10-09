import { supabase } from '@/integrations/supabase/client';

export interface SendNotificationParams {
  userId: string;
  email: string;
  notificationType: string;
  subject: string;
  body: string;
}

/**
 * Send an email notification to a user
 * This function calls the send-notification edge function
 */
export async function sendEmailNotification({
  userId,
  email,
  notificationType,
  subject,
  body,
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userId,
        email,
        notificationType,
        subject,
        body,
      },
    });

    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error invoking notification function:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  return sendEmailNotification({
    userId,
    email,
    notificationType: 'welcome',
    subject: 'Welcome to Ayra!',
    body: `
      <h2>Welcome to Ayra, ${name}!</h2>
      <p>We're excited to have you on board. Ayra is your personal knowledge management system that helps you organize, search, and manage all your information in one place.</p>
      <h3>Getting Started:</h3>
      <ul>
        <li>📝 Import your notes and documents</li>
        <li>🔍 Use AI-powered search to find anything instantly</li>
        <li>📊 Organize with spaces, tags, and categories</li>
        <li>🤖 Chat with your knowledge base using AI</li>
      </ul>
      <p>If you have any questions, feel free to reach out to us!</p>
    `,
  });
}

/**
 * Send a project completion notification
 */
export async function sendProjectCompletionEmail(
  userId: string,
  email: string,
  projectTitle: string
) {
  return sendEmailNotification({
    userId,
    email,
    notificationType: 'project_completion',
    subject: `Project "${projectTitle}" Completed! 🎉`,
    body: `
      <h2>Congratulations!</h2>
      <p>Your project "<strong>${projectTitle}</strong>" has been marked as completed.</p>
      <p>Great job on finishing this project! Keep up the momentum with your next one.</p>
    `,
  });
}

/**
 * Send a reminder notification
 */
export async function sendReminderEmail(
  userId: string,
  email: string,
  reminderText: string,
  dueDate?: string
) {
  return sendEmailNotification({
    userId,
    email,
    notificationType: 'reminder',
    subject: '⏰ Reminder from Ayra',
    body: `
      <h2>Reminder</h2>
      <p>${reminderText}</p>
      ${dueDate ? `<p><strong>Due:</strong> ${dueDate}</p>` : ''}
      <p>Stay on top of your tasks with Ayra!</p>
    `,
  });
}
