import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h1 className="text-2xl font-bold">ScholarHunter</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last Updated: January 31, 2026</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>
                Welcome to ScholarHunter. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our 
                platform and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Data We Collect</h2>
              <p className="mb-2">We may collect, use, store and transfer different kinds of personal data about you:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Identity Data:</strong> First name, last name, username, date of birth</li>
                <li><strong>Contact Data:</strong> Email address, telephone numbers</li>
                <li><strong>Profile Data:</strong> Academic records, CV/resume, test scores, achievements</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform</li>
                <li><strong>Application Data:</strong> Scholarship applications, essays, documents</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
              <p className="mb-2">We use your personal data for the following purposes:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>To match you with relevant scholarship opportunities</li>
                <li>To process and submit scholarship applications on your behalf</li>
                <li>To provide AI-powered services (CV parsing, essay generation, interview prep)</li>
                <li>To communicate with you about deadlines and opportunities</li>
                <li>To improve our platform and services</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Data Security</h2>
              <p>
                We have implemented appropriate security measures to prevent your personal data from being 
                accidentally lost, used, or accessed in an unauthorized way. We use industry-standard encryption, 
                secure authentication, and regular security audits to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
              <p className="mb-2">We may share your personal data with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Scholarship providers (only when submitting applications with your consent)</li>
                <li>AI service providers (Google Gemini) for processing your data</li>
                <li>Cloud infrastructure providers (for hosting and storage)</li>
                <li>Legal authorities (when required by law)</li>
              </ul>
              <p className="mt-2">
                We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Your Rights</h2>
              <p className="mb-2">Under data protection laws, you have rights including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Right to access:</strong> Request copies of your personal data</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to restrict processing:</strong> Request limitation of data processing</li>
                <li><strong>Right to data portability:</strong> Request transfer of your data</li>
                <li><strong>Right to object:</strong> Object to processing of your personal data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Data Retention</h2>
              <p>
                We will only retain your personal data for as long as necessary to fulfill the purposes we collected 
                it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. 
                You can request deletion of your account and data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and store certain 
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is 
                being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Third-Party Services</h2>
              <p className="mb-2">Our platform uses the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google Gemini AI:</strong> For AI-powered features (CV parsing, matching, chat)</li>
                <li><strong>Cloud Hosting:</strong> For infrastructure and data storage</li>
                <li><strong>Analytics:</strong> To understand platform usage and improve services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">10. Children's Privacy</h2>
              <p>
                Our platform is intended for users aged 16 and above. We do not knowingly collect personal data 
                from children under 16. If you are a parent or guardian and believe your child has provided us 
                with personal data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
              <p>
                We may update our privacy policy from time to time. We will notify you of any changes by posting 
                the new privacy policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at:
              </p>
              <ul className="list-none space-y-1 ml-4 mt-2">
                <li><strong>Email:</strong> privacy@scholarhunter.com</li>
                <li><strong>Address:</strong> ScholarHunter Privacy Team</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/terms">
            <Button variant="ghost">View Terms of Service</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ScholarHunter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
