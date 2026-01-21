import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms</h1>
        
        <div className="prose prose-indigo text-gray-600 space-y-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p>
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
          <p>
            Rabbit Calendar provides users with access to a collection of resources, including various communications tools, search services, and personalized content which may be accessed through any medium or device now known or hereafter developed.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">3. User Account, Password, and Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your password and account, and are fully responsible for all activities that occur under your password or account. You agree to immediately notify Rabbit Calendar of any unauthorized use of your password or account or any other breach of security.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">4. User Conduct</h2>
          <p>
            You understand that all information, data, text, software, music, sound, photographs, graphics, video, messages or other materials ("Content"), whether publicly posted or privately transmitted, are the sole responsibility of the person from which such Content originated. This means that you, and not Rabbit Calendar, are entirely responsible for all Content that you upload, post, email, transmit or otherwise make available via the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">5. Termination</h2>
          <p>
            You agree that Rabbit Calendar may, under certain circumstances and without prior notice, immediately terminate your account and access to the Service. Cause for such termination shall include, but not be limited to, (a) breaches or violations of the TOS or other incorporated agreements or guidelines, (b) requests by law enforcement or other government agencies, (c) a request by you (self-initiated account deletions).
          </p>

          <h2 className="text-xl font-semibold text-gray-900">6. Contact Information</h2>
          <p>
            Questions about the Terms of Service should be sent to us at: calendar@rabbit.com.sg
          </p>
        </div>
      </div>
    </div>
  );
};
