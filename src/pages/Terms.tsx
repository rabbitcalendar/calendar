import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="bg-white shadow-sm rounded-2xl p-8 sm:p-12 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms</h1>
          
          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p className="lead">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h3>1. Introduction</h3>
            <p>
              Welcome to Rabbit Calendar ("we," "our," or "us"). By accessing or using our website and services, 
              you agree to be bound by these Terms. If you disagree with any part of the terms, 
              you may not access the service.
            </p>

            <h3>2. Description of Service</h3>
            <p>
              Rabbit Calendar provides a content calendar and social media planning tool for agencies and clients. 
              We reserve the right to modify, suspend, or discontinue the service at any time.
            </p>

            <h3>3. User Accounts</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h3>4. Content and Conduct</h3>
            <p>
              You retain all rights to the content you post. However, you grant us a license to use, store, 
              and display your content solely for the purpose of providing the service. You agree not to post 
              content that is illegal, offensive, or violates the rights of others.
            </p>

            <h3>5. Limitation of Liability</h3>
            <p>
              In no event shall Rabbit Calendar be liable for any indirect, incidental, special, consequential 
              or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other 
              intangible losses.
            </p>

            <h3>6. Changes to Terms</h3>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material changes. 
              Your continued use of the service constitutes acceptance of the new terms.
            </p>

            <h3>7. Contact Us</h3>
            <p>
              If you have any questions about these Terms, please contact us at calendar@rabbit.com.sg.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
