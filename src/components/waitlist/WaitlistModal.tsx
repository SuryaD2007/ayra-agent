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
import { useForm } from "react-hook-form"

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

interface WaitlistFormData {
  name: string
  email: string
  university: string
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
  const [universityInput, setUniversityInput] = useState("")
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<WaitlistFormData>()

  const onSubmit = async (data: WaitlistFormData) => {
    console.log("Waitlist submission:", data)
    toast.success("🎉 Welcome to Ayra! We'll notify you on October 17th when we launch!", {
      duration: 5000,
    })
    reset()
    setUniversityInput("")
    onClose()
  }

  const handleUniversityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUniversityInput(value)
    setValue("university", value)
    
    // Auto-fill if there's a match
    if (value.length >= 2) {
      const match = UNIVERSITIES.find(uni => 
        uni.toLowerCase().startsWith(value.toLowerCase())
      )
      if (match && match.toLowerCase() !== value.toLowerCase()) {
        // Set the auto-filled value but keep cursor position
        setTimeout(() => {
          const input = e.target
          const cursorPos = value.length
          input.value = match
          input.setSelectionRange(cursorPos, match.length)
          setUniversityInput(match)
          setValue("university", match)
        }, 0)
      }
    }
  }

  const handleClose = () => {
    reset()
    setUniversityInput("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-lg pointer-events-none" />
        <DialogHeader className="relative z-10 space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-scale-in">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
            Join Our Waitlist
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Be among the first to experience Ayra when we launch on <strong>October 17th</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 grid gap-6 py-6">
          <div className="grid gap-3 animate-fade-in">
            <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
            <div className="relative group">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="name"
                className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-all duration-200 bg-background/50"
                placeholder="Enter your full name"
                {...register("name", { required: "Full name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-all duration-200 bg-background/50"
                placeholder="Enter your email address"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <Label htmlFor="university" className="text-sm font-medium">School/University</Label>
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="university"
                className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-all duration-200 bg-background/50"
                placeholder="Start typing your school or university..."
                value={universityInput}
                onChange={handleUniversityChange}
                autoComplete="off"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <Check className="mr-2 h-5 w-5" /> 
            {isSubmitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
