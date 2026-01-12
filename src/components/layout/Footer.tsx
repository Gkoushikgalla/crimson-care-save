import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="h-7 w-7 text-primary fill-primary" />
              <span className="text-lg font-display font-bold">
                Crimson<span className="text-primary">Care</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-enabled smart blood donation and emergency assistance system. Saving lives, one donation at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["About Us", "Find Donors", "Emergency SOS", "Blood Banks"].map((link) => (
                <li key={link}>
                  <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Donors */}
          <div>
            <h4 className="font-semibold mb-4">For Donors</h4>
            <ul className="space-y-2">
              {["Register as Donor", "Donation History", "Rewards & Badges", "Health Tips"].map((link) => (
                <li key={link}>
                  <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+91 7416899999</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>22211a05c8@bvrit.ac.in</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>
                  123 Healthcare Ave,
                  <br />
                  Medical District, MD 12345
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2024 CrimsonCare. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link) => (
              <Link key={link} to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
