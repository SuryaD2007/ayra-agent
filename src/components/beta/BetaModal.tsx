import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

// Comprehensive universities for autofill
const UNIVERSITIES = [
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
  'Northeastern University',
  'University of Florida',
  'Ohio State University',
  'University of Minnesota',
  'University of Maryland',
  'Purdue University',
  'University of Arizona',
  'Arizona State University',
  'University of Colorado Boulder',
  'University of Pittsburgh',
  'Penn State University',
  'Michigan State University',
  'Indiana University',
  'University of Iowa',
  'University of Oregon',
  'University of Utah',
  'Virginia Tech',
  'North Carolina State University',
  'Clemson University',
  'University of Alabama',
  'Auburn University',
  'University of Georgia',
  'University of Kentucky',
  'University of Tennessee',
  'Vanderbilt University',
  'Rice University',
  'Emory University',
  'University of Miami',
  'Florida State University',
  'University of South Florida',
  'University of Central Florida',
  'Texas A&M University',
  'Texas A&M University at Galveston',
  'Texas A&M University-Commerce',
  'Texas A&M University-Corpus Christi',
  'Texas A&M University-Kingsville',
  'Texas A&M University-Texarkana',
  'Texas A&M International University',
  'Prairie View A&M University',
  'West Texas A&M University',
  'University of Houston',
  'University of Houston-Clear Lake',
  'University of Houston-Downtown',
  'University of Houston-Victoria',
  'Texas Tech University',
  'Texas Tech University Health Sciences Center',
  'Baylor University',
  'Southern Methodist University',
  'Texas Christian University',
  'University of Texas at Dallas',
  'University of Texas at San Antonio',
  'University of Texas at Arlington',
  'University of Texas at El Paso',
  'University of Texas Rio Grande Valley',
  'University of Texas at Tyler',
  'University of Texas Permian Basin',
  'University of Texas Health Science Center at Houston',
  'University of Texas Health Science Center at San Antonio',
  'University of Texas Medical Branch',
  'University of Texas Southwestern Medical Center',
  'Rice University',
  'Texas State University',
  'University of North Texas',
  'Texas Southern University',
  'Sam Houston State University',
  'Stephen F. Austin State University',
  'Lamar University',
  'Texas Woman\'s University',
  'Tarleton State University',
  'Angelo State University',
  'Sul Ross State University',
  'Midwestern State University',
  'University of the Incarnate Word',
  'Trinity University',
  'St. Edward\'s University',
  'Southwestern University',
  'Austin College',
  'Schreiner University',
  'Texas Wesleyan University',
  'Dallas Baptist University',
  'Houston Baptist University',
  'Hardin-Simmons University',
  'Abilene Christian University',
  'McMurry University',
  'Texas Lutheran University',
  'Concordia University Texas',
  'Our Lady of the Lake University',
  'St. Mary\'s University',
  'Texas A&M University-San Antonio',
  'The University of Texas at Austin',
  'University of Oklahoma',
  'Oklahoma State University',
  'University of Kansas',
  'Kansas State University',
  'University of Missouri',
  'Washington University in St. Louis',
  'Saint Louis University',
  'University of Nebraska',
  'University of Arkansas',
  'Louisiana State University',
  'Tulane University',
  'University of Mississippi',
  'Mississippi State University',
  'University of South Carolina',
  'College of Charleston',
  'Wake Forest University',
  'Davidson College',
  'University of Delaware',
  'Villanova University',
  'Drexel University',
  'Temple University',
  'University of Connecticut',
  'University of Vermont',
  'University of New Hampshire',
  'University of Maine',
  'University of Rhode Island',
  'Brown University',
  'Dartmouth College',
  'Middlebury College',
  'Williams College',
  'Amherst College',
  'Wellesley College',
  'Smith College',
  'Mount Holyoke College',
  'Bowdoin College',
  'Colby College',
  'Bates College',
  'Tufts University',
  'Brandeis University',
  'Boston College',
  'Babson College',
  'Bentley University',
  'Emerson College',
  'Suffolk University',
  'University of Massachusetts Amherst',
  'Worcester Polytechnic Institute',
  'Rensselaer Polytechnic Institute',
  'Rochester Institute of Technology',
  'Syracuse University',
  'University of Rochester',
  'Colgate University',
  'Hamilton College',
  'Vassar College',
  'Barnard College',
  'Cooper Union',
  'Fordham University',
  'Pace University',
  'St. Johns University',
  'Hofstra University',
  'Stony Brook University',
  'University at Buffalo',
  'Binghamton University',
  'University at Albany',
  'Clarkson University',
  'Union College',
  'Skidmore College',
  'Siena College',
  'Ithaca College',
  'Marist College',
  'Manhattan College',
  'Stevens Institute of Technology',
  'Rutgers University',
  'Princeton University',
  'The College of New Jersey',
  'Rider University',
  'Seton Hall University',
  'Fairleigh Dickinson University',
  'Montclair State University',
  'Rowan University',
  'Stockton University',
  'Drew University',
  'Lafayette College',
  'Lehigh University',
  'Bucknell University',
  'Dickinson College',
  'Franklin & Marshall College',
  'Gettysburg College',
  'Muhlenberg College',
  'Susquehanna University',
  'Elizabethtown College',
  'Messiah University',
  'York College of Pennsylvania',
  'Millersville University',
  'West Chester University',
  'Shippensburg University',
  'Kutztown University',
  'East Stroudsburg University',
  'Bloomsburg University',
  'California University of Pennsylvania',
  'Clarion University',
  'Edinboro University',
  'Indiana University of Pennsylvania',
  'Lock Haven University',
  'Mansfield University',
  'Slippery Rock University',
  'University of the Sciences',
  'Thomas Jefferson University',
  'University of Delaware',
  'Delaware State University',
  'Wesley College',
  'Goldey-Beacom College',
  'University of Maryland, College Park',
  'University of Maryland, Baltimore County',
  'Towson University',
  'Salisbury University',
  'Frostburg State University',
  'Bowie State University',
  'Coppin State University',
  'Morgan State University',
  'University of Baltimore',
  'Loyola University Maryland',
  'Goucher College',
  'McDaniel College',
  'Washington College',
  'St. Marys College of Maryland',
  'Hood College',
  'Mount St. Marys University',
  'Stevenson University',
  'Notre Dame of Maryland University',
  'Johns Hopkins University',
  'University of Richmond',
  'Virginia Commonwealth University',
  'James Madison University',
  'Old Dominion University',
  'George Mason University',
  'Virginia Military Institute',
  'Virginia State University',
  'Norfolk State University',
  'Hampton University',
  'Christopher Newport University',
  'Longwood University',
  'Radford University',
  'The Citadel',
  'College of William & Mary',
  'Washington and Lee University',
  'University of Mary Washington',
  'Bridgewater College',
  'Roanoke College',
  'Hampden-Sydney College',
  'Randolph-Macon College',
  'Sweet Briar College',
  'Hollins University',
  'Lynchburg University',
  'Liberty University',
  'Regent University',
  'Eastern Mennonite University',
  'Shenandoah University',
  'Marymount University',
  'George Washington University',
  'American University',
  'Howard University',
  'Gallaudet University',
  'Trinity Washington University',
  'Catholic University of America',
  'Georgetown University',
  'University of the District of Columbia'
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
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setUniversity('');
    setSuggestion('');
    setIsSubmitting(false);
    onClose();
  };

  const handleUniversityChange = (value: string) => {
    setUniversity(value);
    
    if (value.length > 2) {
      // Find the best matching university that starts with the typed text
      const match = UNIVERSITIES.find(uni =>
        uni.toLowerCase().startsWith(value.toLowerCase())
      );
      
      if (match && match.toLowerCase() !== value.toLowerCase()) {
        setSuggestion(match.substring(value.length));
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'ArrowRight') {
      if (suggestion) {
        e.preventDefault();
        const fullText = university + suggestion;
        setUniversity(fullText);
        setSuggestion('');
      }
    }
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
            <div className="relative">
              <Input
                id="university"
                type="text"
                required
                placeholder="University of Texas"
                value={university}
                onChange={(e) => handleUniversityChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="mt-1 rounded-xl border-input bg-background/50 px-4 py-3 focus:ring-2 focus:ring-primary relative z-10 bg-transparent"
              />
              {suggestion && (
                <div className="absolute inset-0 mt-1 rounded-xl px-4 py-3 pointer-events-none flex items-center text-muted-foreground">
                  <span className="invisible">{university}</span>
                  <span className="text-muted-foreground/60">{suggestion}</span>
                </div>
              )}
            </div>
            {suggestion && (
              <p className="text-xs text-muted-foreground mt-1">
                Press Tab or → to accept suggestion
              </p>
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