
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useMemo } from "react"
import { Check, Mail, User, Search, GraduationCap } from "lucide-react"
import { toast } from "sonner"

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

const UNIVERSITIES = [
  // Top Texas Universities
  "University of Texas at Austin",
  "Texas A&M University",
  "Rice University",
  "University of Houston",
  "Texas Tech University",
  "Baylor University",
  "Southern Methodist University",
  "Texas Christian University",
  "University of Texas at Dallas",
  "Texas State University",
  
  // Top Florida Universities
  "University of Florida",
  "Florida State University",
  "University of Miami",
  "Florida Institute of Technology",
  "University of Central Florida",
  "Florida International University",
  "Nova Southeastern University",
  "Florida Atlantic University",
  "Florida Institute of Technology",
  "University of South Florida",
  
  // Top 100 Universities (selection)
  "Harvard University",
  "Stanford University",
  "Massachusetts Institute of Technology",
  "California Institute of Technology",
  "Princeton University",
  "Yale University",
  "University of Chicago",
  "Columbia University",
  "University of Pennsylvania",
  "Northwestern University",
  "Duke University",
  "Johns Hopkins University",
  "Dartmouth College",
  "Brown University",
  "Cornell University",
  "Vanderbilt University",
  "Washington University in St. Louis",
  "University of Notre Dame",
  "University of California, Los Angeles",
  "Emory University",
  "University of California, Berkeley",
  "Georgetown University",
  "Carnegie Mellon University",
  "University of Southern California",
  "University of Virginia",
  "Wake Forest University",
  "New York University",
  "University of North Carolina at Chapel Hill",
  "Boston College",
  "College of William & Mary",
  "University of Rochester",
  "Brandeis University",
  "Georgia Institute of Technology",
  "Case Western Reserve University",
  "Boston University",
  "Tulane University",
  "University of Wisconsin-Madison",
  "University of Illinois at Urbana-Champaign",
  "University of Washington",
  "Other"
].sort()

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    university: ""
  })
  const [universitySearch, setUniversitySearch] = useState("")
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)

  const filteredUniversities = useMemo(() => {
    if (!universitySearch) return UNIVERSITIES
    return UNIVERSITIES.filter(uni => 
      uni.toLowerCase().includes(universitySearch.toLowerCase())
    )
  }, [universitySearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitted data:", formData)
    toast.success("🎉 Welcome to Ayra! We'll be in touch soon with exclusive early access.", {
      duration: 5000,
    })
    onClose()
  }

  const handleUniversitySelect = (university: string) => {
    setFormData({ ...formData, university })
    setUniversitySearch(university)
    setShowUniversityDropdown(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/20 overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-lg pointer-events-none" />
        <DialogHeader className="relative z-10 space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-scale-in">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
            Join Our Exclusive Waitlist
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Be among the first students to experience the future of learning with Ayra.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="relative z-10 grid gap-6 py-6">
          <div className="grid gap-3 animate-fade-in">
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <div className="relative group">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="name"
                className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-all duration-200 bg-background/50"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-all duration-200 bg-background/50"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <Label htmlFor="university" className="text-sm font-medium">University</Label>
            <div className="relative">
              <div className="relative group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  id="university"
                  className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-all duration-200 bg-background/50"
                  placeholder="Search for your university..."
                  value={universitySearch}
                  onChange={(e) => {
                    setUniversitySearch(e.target.value)
                    setShowUniversityDropdown(true)
                  }}
                  onFocus={() => setShowUniversityDropdown(true)}
                  required
                />
              </div>
              
              {showUniversityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-muted-foreground/20 rounded-md shadow-2xl max-h-48 overflow-y-auto animate-slide-up" style={{ zIndex: 999 }}>
                  {filteredUniversities.length > 0 ? (
                    filteredUniversities.map((university) => (
                      <button
                        key={university}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors text-sm border-b border-muted-foreground/10 last:border-b-0"
                        onClick={() => handleUniversitySelect(university)}
                      >
                        {university}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-muted-foreground text-sm">
                      No universities found. Try a different search term.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <Check className="mr-2 h-5 w-5" /> 
            Secure My Spot
          </Button>
        </form>

        {/* Click outside to close */}
        {showUniversityDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUniversityDropdown(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
