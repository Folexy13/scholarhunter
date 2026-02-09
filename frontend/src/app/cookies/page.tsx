import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookiesPage() {
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
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last Updated: January 31, 2026</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit a 
                website. They are widely used to make websites work more efficiently and provide information to 
                the owners of the site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. How We Use Cookies</h2>
              <p className="mb-2">
                ScholarHunter uses cookies to enhance your experience on our platform. We use cookies for:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
                <li><strong>Preferences:</strong> To remember your settings and preferences (theme, language)</li>
                <li><strong>Security:</strong> To protect against fraudulent activity and enhance security</li>
                <li><strong>Analytics:</strong> To understand how you use our platform and improve it</li>
                <li><strong>Performance:</strong> To monitor and improve platform performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Types of Cookies We Use</h2>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Essential Cookies</h3>
                  <p>
                    These cookies are necessary for the platform to function properly. They enable core 
                    functionality such as security, authentication, and accessibility. The platform cannot 
                    function properly without these cookies.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><code>auth_token</code> - Maintains your login session</li>
                    <li><code>csrf_token</code> - Protects against cross-site request forgery</li>
                    <li><code>session_id</code> - Identifies your session</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Functional Cookies</h3>
                  <p>
                    These cookies enable enhanced functionality and personalization, such as remembering your 
                    preferences and settings.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><code>theme_preference</code> - Remembers your dark/light mode choice</li>
                    <li><code>language</code> - Stores your language preference</li>
                    <li><code>sidebar_state</code> - Remembers if sidebar is collapsed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Cookies</h3>
                  <p>
                    These cookies help us understand how visitors interact with our platform by collecting and 
                    reporting information anonymously.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><code>_ga</code> - Google Analytics tracking</li>
                    <li><code>_gid</code> - Google Analytics session tracking</li>
                    <li><code>analytics_session</code> - Platform usage analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Performance Cookies</h3>
                  <p>
                    These cookies collect information about how you use our platform to help us improve 
                    performance and user experience.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><code>performance_metrics</code> - Page load times and errors</li>
                    <li><code>api_cache</code> - Caches API responses for faster loading</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Third-Party Cookies</h2>
              <p className="mb-2">
                We may use third-party services that set cookies on your device. These include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google Analytics:</strong> For website analytics and usage statistics</li>
                <li><strong>Google Gemini AI:</strong> For AI-powered features (does not set cookies directly)</li>
                <li><strong>Cloud Infrastructure:</strong> For hosting and content delivery</li>
              </ul>
              <p className="mt-2">
                These third parties have their own privacy policies and cookie policies. We recommend reviewing 
                them to understand how they use cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Cookie Duration</h2>
              <p className="mb-2">Cookies can be either:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser
                </li>
                <li>
                  <strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period or 
                  until you delete them
                </li>
              </ul>
              <p className="mt-2">
                Most of our cookies are session cookies. Persistent cookies (like authentication tokens) typically 
                expire after 7-30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Managing Cookies</h2>
              <p className="mb-2">
                You have the right to decide whether to accept or reject cookies. You can manage your cookie 
                preferences through:
              </p>
              
              <div className="space-y-3 mt-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Browser Settings</h3>
                  <p>
                    Most web browsers allow you to control cookies through their settings. You can set your 
                    browser to refuse cookies or delete certain cookies. However, if you block or delete cookies, 
                    some features of our platform may not work properly.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Browser-Specific Instructions</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies</li>
                    <li><strong>Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies</li>
                    <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Cookies</li>
                    <li><strong>Edge:</strong> Settings &gt; Privacy &gt; Cookies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Platform Settings</h3>
                  <p>
                    You can manage non-essential cookies through your account settings once logged in. Essential 
                    cookies cannot be disabled as they are necessary for the platform to function.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Do Not Track</h2>
              <p>
                Some browsers have a &quot;Do Not Track&quot; feature that lets you tell websites you do not want to have 
                your online activities tracked. We currently do not respond to Do Not Track signals, but we are 
                committed to respecting your privacy preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                other operational, legal, or regulatory reasons. We will notify you of any material changes by 
                posting the new policy on this page and updating the &quot;Last Updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <ul className="list-none space-y-1 ml-4 mt-2">
                <li><strong>Email:</strong> privacy@scholarhunter.com</li>
                <li><strong>Support:</strong> support@scholarhunter.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">10. More Information</h2>
              <p className="mb-2">
                For more information about cookies and how they work, you can visit:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All About Cookies: www.allaboutcookies.org</li>
                <li>Network Advertising Initiative: www.networkadvertising.org</li>
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
