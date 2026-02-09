import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last Updated: January 31, 2026</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using ScholarHunter (&quot;the Platform&quot;), you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to these Terms of Service, please do 
                not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>
                ScholarHunter is an AI-powered scholarship matching and application platform that helps students 
                find, match with, and apply to scholarship opportunities worldwide. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>AI-powered scholarship matching based on your profile</li>
                <li>Automated application assistance and document generation</li>
                <li>CV/Resume parsing and analysis</li>
                <li>Interview preparation tools</li>
                <li>Application tracking and deadline management</li>
                <li>AI chat assistant for scholarship-related queries</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. User Accounts</h2>
              <p className="mb-2">When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maintaining the confidentiality of your account and password</li>
                <li>Restricting access to your computer and account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. User Responsibilities</h2>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and truthful information in your profile and applications</li>
                <li>Review all AI-generated content before submission</li>
                <li>Comply with all scholarship provider requirements and deadlines</li>
                <li>Not use the Platform for any illegal or unauthorized purpose</li>
                <li>Not interfere with or disrupt the Platform or servers</li>
                <li>Not attempt to gain unauthorized access to any part of the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. AI-Generated Content</h2>
              <p>
                Our Platform uses AI (Google Gemini) to generate essays, parse CVs, and provide recommendations. 
                While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You are 
                solely responsible for reviewing, editing, and verifying all AI-generated content before submission 
                to scholarship providers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. No Guarantee of Success</h2>
              <p>
                ScholarHunter provides tools and services to assist with scholarship applications, but we do not 
                guarantee that you will be awarded any scholarship. Success depends on many factors including your 
                qualifications, the quality of your applications, and scholarship provider decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
              <p className="mb-2">
                The Platform and its original content, features, and functionality are owned by ScholarHunter and 
                are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mt-2">
                You retain ownership of content you submit to the Platform (CV, essays, documents). By submitting 
                content, you grant us a license to use, modify, and process it to provide our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Prohibited Uses</h2>
              <p className="mb-2">You may not use the Platform:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any false, misleading, or fraudulent information</li>
                <li>To impersonate or attempt to impersonate another person</li>
                <li>To engage in any automated use of the system (bots, scrapers)</li>
                <li>To interfere with or circumvent security features</li>
                <li>To upload viruses or malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Payment and Fees</h2>
              <p>
                Some features of the Platform may require payment. All fees are non-refundable unless otherwise 
                stated. We reserve the right to change our pricing at any time with notice to users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">10. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Platform immediately, without prior 
                notice or liability, for any reason, including if you breach these Terms. Upon termination, your 
                right to use the Platform will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
              <p>
                In no event shall ScholarHunter, its directors, employees, or agents be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including loss of profits, data, or other 
                intangible losses, resulting from your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">12. Disclaimer</h2>
              <p>
                The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, 
                expressed or implied, regarding the Platform&apos;s operation or the information, content, or materials 
                included on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">13. Third-Party Links</h2>
              <p>
                Our Platform may contain links to third-party websites or services (scholarship providers, 
                universities). We are not responsible for the content, privacy policies, or practices of any 
                third-party sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">14. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. We will provide notice of any 
                material changes by posting the new Terms on this page and updating the &quot;Last Updated&quot; date. 
                Your continued use of the Platform after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">15. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with applicable laws, without regard 
                to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">16. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul className="list-none space-y-1 ml-4 mt-2">
                <li><strong>Email:</strong> legal@scholarhunter.com</li>
                <li><strong>Support:</strong> support@scholarhunter.com</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/privacy">
            <Button variant="ghost">View Privacy Policy</Button>
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
