import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

// Common universities for autofill
const COMMON_UNIVERSITIES = [
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology',
  'California Institute of Technology',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'Yale University',
  'Princeton University',
  'Columbia University',
  'University of Chicago',
  'University of Pennsylvania',
  'Cornell University',
  'University of Michigan',
  'Carnegie Mellon University',
  'Northwestern University',
  'New York University',
  'University of Southern California',
  'Duke University',
  'Georgetown University',
  'University of Virginia',
  'University of Washington',
  'University of Texas at Austin',
  'Georgia Institute of Technology',
  'University of Illinois at Urbana-Champaign',
  'University of Wisconsin-Madison',
  'University of California, San Diego',
  'University of California, Davis',
  'University of North Carolina at Chapel Hill',
  'Boston University',
  'Northeastern University'
];

interface BetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  os: 'mac' | 'windows';
}

export function BetaModal({ isOpen, onClose, os }: BetaModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setUniversity('');
    setUniversitySuggestions([]);
    setShowSuggestions(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleUniversityChange = (value: string) => {
    setUniversity(value);
    
    if (value.length > 1) {
      const filtered = COMMON_UNIVERSITIES.filter(uni =>
        uni.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setUniversitySuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectUniversity = (selectedUni: string) => {
    setUniversity(selectedUni);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

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

    if (!university.trim()) {
      toast({
        title: "Error",
        description: "Please enter your university or school.",
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
          note: `Name: ${fullName.trim()}, University: ${university.trim()}`,
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
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              required
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 rounded-xl border-input bg-background/50 px-4 py-3 focus:ring-2 focus:ring-primary"
            />
          </div>

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

          <div className="relative">
            <Label htmlFor="university" className="text-sm font-medium">
              University/School
            </Label>
            <Input
              id="university"
              type="text"
              required
              placeholder="Harvard University"
              value={university}
              onChange={(e) => handleUniversityChange(e.target.value)}
              onFocus={() => university.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="mt-1 rounded-xl border-input bg-background/50 px-4 py-3 focus:ring-2 focus:ring-primary"
            />
            
            {showSuggestions && universitySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-input rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {universitySuggestions.map((uni, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectUniversity(uni)}
                    className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm border-0 bg-transparent"
                  >
                    {uni}
                  </button>
                ))}
              </div>
            )}
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