import React, { useState } from 'react';
import {
  Download,
  FileText,
  Maximize2,
  Menu,
  MoreVertical,
  Printer,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface TermsConditionsProps {
  onAccept: () => void;
  onBack: () => void;
  role: 'buyer' | 'seller';
}

const pages = [1, 2, 3, 4];

export default function TermsConditions({ onAccept, role }: TermsConditionsProps) {
  const [accepted, setAccepted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1500px] transition-all duration-300',
        isFullscreen && 'fixed inset-0 z-50 max-w-none overflow-y-auto bg-white p-3 sm:p-4 md:p-8'
      )}
    >
      <section
        className={cn(
          'rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-9',
          isFullscreen && 'flex h-full flex-col'
        )}
      >
        <h2 className="mb-4 text-sm font-bold leading-snug text-slate-800 sm:text-base md:mb-7 md:text-xl">
          Please Read And Agree To The Terms & Conditions Of Government E-Marketplace (GeM) Before Sign Up.
        </h2>

        <div className={cn('overflow-hidden rounded border border-slate-300 bg-[#262626]', isFullscreen && 'min-h-0 flex-1')}>
          <PdfToolbar role={role} />

          <div className={cn('grid bg-[#242424] md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[355px_minmax(0,1fr)]', isFullscreen ? 'h-[calc(100dvh-240px)] min-h-[360px]' : 'h-[60dvh] min-h-[420px] md:h-[546px]')}>
            <aside className="hidden overflow-y-auto border-r border-slate-700 bg-[#262626] px-8 py-6 md:block">
              <div className="space-y-8">
                {pages.map((page) => (
                  <button key={page} className="mx-auto block w-full text-center text-white">
                    <div
                      className={cn(
                        'mx-auto aspect-[3/4] w-36 bg-white p-2 shadow-md ring-2',
                        page === 1 ? 'ring-blue-400' : 'ring-transparent'
                      )}
                    >
                      <MiniPage faded={page !== 1} />
                    </div>
                    <span className="mt-3 block text-sm">{page}</span>
                  </button>
                ))}
              </div>
            </aside>

            <main className="overflow-y-auto bg-white px-4 py-0 sm:px-5 md:px-16">
              <article className="mx-auto min-h-full max-w-[760px] bg-white py-6 font-serif text-[15px] leading-relaxed text-black sm:text-[17px] md:py-8 md:text-[20px]">
                <p className="text-center font-bold leading-snug">
                  Track / Domain Specific STC of Particular Service including its SLA
                  <br />
                  (Service Level Agreement) and BID/Reverse Auction Specific Additional
                  <br />
                  Terms and Conditions (ATC) as applicable.
                </p>

                <p className="mt-3 text-justify">
                  Government e-Marketplace (GeM) is the National Public Procurement Portal; an end-to-end online
                  Marketplace for Central and State Government Ministries / Departments, Central & State Public Sector
                  Undertakings and autonomous institutions for procurement of common use goods & services.
                </p>

                <p className="mt-4 text-justify">
                  This portal is adapted for PugArch MSME Marketplace registration and onboarding. The terms below
                  govern participation for {role === 'seller' ? 'sellers, service providers' : 'buyers, procurement users'} and
                  authorized representatives using the platform.
                </p>

                <section className="mt-5">
                  <h3 className="font-bold">2. General Terms and Definitions:</h3>
                  <p className="mt-4 pl-4 text-justify sm:pl-8">
                    a. <strong>&ldquo;APPLICABLE LAWS&rdquo;</strong> shall mean any statute, law, ordinance, notification,
                    rule, regulation, judgment, order, decree, bye-law, approval, directive, guideline, policy or other
                    governmental restriction as may be in effect.
                  </p>
                  <p className="mt-4 pl-4 text-justify sm:pl-8">
                    b. <strong>&ldquo;USER&rdquo;</strong> shall mean the individual or organization registering on behalf of a
                    competent buyer or seller entity and accepting responsibility for the accuracy of all information
                    submitted during sign up.
                  </p>
                </section>

                <section className="mt-5">
                  <h3 className="font-bold">3. Registration and Verification:</h3>
                  <p className="mt-4 text-justify">
                    Users agree that identity, email, mobile number, Aadhaar, PAN, business registration and other
                    submitted details may be verified through appropriate authorities or approved verification services.
                    Any misrepresentation may lead to rejection, suspension or further action as applicable.
                  </p>
                </section>

                <section className="mt-5">
                  <h3 className="font-bold">4. Procurement Guidelines (For Buyers):</h3>
                  <p className="mt-4 text-justify">
                    Buyers shall ensure that all procurement activities conducted through the MSME Marketplace 
                    comply with the General Financial Rules (GFR), 2017 and any specific guidelines issued by 
                    their respective departments or organizations. The platform provides tools for comparative 
                    analysis and selection, but the final responsibility for procurement decisions rests with 
                    the Buyer organization.
                  </p>
                </section>

                <section className="mt-5">
                  <h3 className="font-bold">5. Code of Conduct:</h3>
                  <p className="mt-4 text-justify">
                    All users are expected to maintain the highest standards of integrity and transparency. 
                    Collusion, price manipulation, or any fraudulent activity is strictly prohibited and will 
                    result in immediate termination of access and possible legal action.
                  </p>
                </section>

                <section className="mt-5">
                  <h3 className="font-bold">6. Amendments to Terms:</h3>
                  <p className="mt-4 text-justify">
                    PugArch reserves the right to modify these terms and conditions at any time. Users will 
                    be notified of significant changes, and continued use of the platform after such 
                    notifications will constitute acceptance of the revised terms.
                  </p>
                </section>
              </article>
            </main>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 md:mt-6 md:flex-row md:items-center md:justify-between">
          <label className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-relaxed text-slate-800 md:text-lg">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-6 w-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>* I have read and agree to the Terms & Conditions of Government e-Marketplace (GeM)</span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
            <button
              type="button"
              onClick={() => setIsFullscreen((value) => !value)}
              className="h-12 rounded-lg px-5 text-sm font-bold uppercase tracking-wide text-blue-600 hover:bg-blue-50 hover:underline"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            </button>
            <Button
              onClick={onAccept}
              disabled={!accepted}
              className={cn(
                'h-14 w-full rounded px-10 text-sm font-bold uppercase tracking-wide shadow-none sm:w-auto sm:min-w-[185px]',
                accepted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-200'
              )}
            >
              Proceed
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PdfToolbar({ role }: { role: 'buyer' | 'seller' }) {
  return (
    <div className="flex min-h-14 items-center gap-2 bg-[#373737] px-3 py-2 text-white sm:h-[68px] sm:gap-3 sm:px-5 sm:py-0">
      <Menu className="h-6 w-6 shrink-0 text-slate-200" />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileText className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
        <span className="truncate text-sm font-semibold md:text-base">
          Microsoft Word - GTC GeM 4.0 ({role === 'buyer' ? 'Buyer' : 'Seller'} Registration)
        </span>
      </div>
      <div className="hidden items-center gap-2 text-sm md:flex">
        <span className="bg-[#111] px-2 py-1">1</span>
        <span>/ 54</span>
      </div>
      <div className="hidden items-center gap-4 border-l border-slate-500 pl-4 lg:flex">
        <ZoomOut className="h-4 w-4" />
        <span className="bg-[#111] px-2 py-1 text-sm font-bold">100%</span>
        <ZoomIn className="h-4 w-4" />
      </div>
      <div className="ml-auto flex items-center gap-3 text-slate-200 sm:gap-4">
        <Search className="hidden h-5 w-5 sm:block" />
        <RotateCcw className="hidden h-5 w-5 sm:block" />
        <a 
          href="/terms_and_conditions.pdf" 
          download="MSME_Marketplace_Terms_Conditions.pdf"
          className="transition-colors hover:text-white"
          title="Download Terms & Conditions"
        >
          <Download className="h-5 w-5" />
        </a>
        <Printer className="hidden h-5 w-5 sm:block" />
        <Maximize2 className="h-5 w-5" />
        <MoreVertical className="h-5 w-5" />
      </div>
    </div>
  );
}

function MiniPage({ faded }: { faded: boolean }) {
  return (
    <div className={cn('h-full space-y-1.5 p-2', faded && 'opacity-40')}>
      <div className="mx-auto mb-2 h-1 w-1/2 bg-slate-300" />
      {Array.from({ length: 16 }).map((_, index) => (
        <div
          key={index}
          className={cn('h-1 bg-slate-400', index % 5 === 0 ? 'w-3/4' : index % 3 === 0 ? 'w-10/12' : 'w-full')}
        />
      ))}
      <div className="mt-3 space-y-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-1 w-full bg-slate-300" />
        ))}
      </div>
    </div>
  );
}
