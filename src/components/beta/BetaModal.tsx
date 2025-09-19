import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface BetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  os: 'mac' | 'windows';
}

export function BetaModal({ isOpen, onClose, os }: BetaModalProps) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setEmail('');
    setNote('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error", 
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('beta_signups')
        .insert([{
          email: email.trim(),
          os,
          note: note.trim() || null,
          source: 'website'
        }]);

      if (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "You're on the list! We'll email your invite soon. 🎉",
        });
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = os === 'mac' ? 'Join the Mac Beta' : 'Join the Windows Beta';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[92%] max-w-md rounded-2xl p-6">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 rounded-xl border-input bg-background/50 px-4 py-3 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <Label htmlFor="note" className="text-sm font-medium">
              Optional note
            </Label>
            <Input
              id="note"
              type="text"
              placeholder="What do you want Ayra to help with?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 rounded-xl border-input bg-background/50 px-4 py-3 focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl px-4 py-3 font-semibold"
          >
            {isSubmitting ? 'Submitting...' : 'Request Invite'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}