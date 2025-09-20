import { AnimatedTransition } from '@/components/AnimatedTransition';
interface UniversityStudentsSectionProps {
  show: boolean;
}
export const UniversityStudentsSection = ({
  show
}: UniversityStudentsSectionProps) => {
  const universities = [{
    name: "University of Texas",
    short: "UT",
    logo: "/assets/ut-logo.png",
    isImage: true
  }, {
    name: "Texas A&M University",
    short: "A&M",
    logo: "/assets/am-logo.png",
    isImage: true
  }, {
    name: "UT Dallas",
    short: "UTD",
    logo: "/assets/utd-logo.png",
    isImage: true
  }, {
    name: "University of South Florida",
    short: "USF",
    logo: "/assets/usf-logo.png",
    isImage: true
  }, {
    name: "University of Florida",
    short: "UF",
    logo: "/assets/uf-logo.png",
    isImage: true
  }, {
    name: "University of Illinois",
    short: "UIUC",
    logo: "/assets/uiuc-logo.png",
    isImage: true
  }, {
    name: "University of Southern California",
    short: "USC",
    logo: "/assets/usc-logo.png",
    isImage: true
  }, {
    name: "Indiana University",
    short: "IU",
    logo: "/assets/iu-logo.png",
    isImage: true
  }, {
    name: "IIT Guwahati",
    short: "IITG",
    logo: "/assets/iitg-logo.png",
    isImage: true
  }, {
    name: "University of Virginia",
    short: "UV",
    logo: "/assets/uv-logo.png",
    isImage: true
  }];
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="mt-16 mb-8">
        <div className="text-center mb-12">
          <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
            Tested by students from
          </h3>
          
          {/* Animated university logos */}
          <div className="relative overflow-hidden">
            <div className="flex animate-slide-marquee">
              {[...universities, ...universities].map((university, index) => <div key={`${university.short}-${index}`} className="flex-shrink-0 mx-6 flex flex-col items-center group hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl mb-2 group-hover:shadow-lg transition-shadow duration-300">
                    {university.isImage ? <img src={university.logo} alt={`${university.name} logo`} className="w-12 h-12 object-contain" /> : university.logo}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {university.short}
                  </span>
                </div>)}
            </div>
          </div>
          
          {/* Student testimonial badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="px-4 py-2 bg-accent/5 rounded-full border border-accent/10">
              <span className="text-zinc-900 text-base font-bold">10+ Universities</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedTransition>;
};