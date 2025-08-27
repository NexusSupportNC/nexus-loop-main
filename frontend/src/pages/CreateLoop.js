import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoopForm from '../components/LoopForm';
import { loopAPI, apiUtils } from '../services/api';

const CreateLoop = ({ user, addNotification }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await loopAPI.createLoop(formData);
      
      if (response.data.success) {
        addNotification('Transaction loop created successfully!', 'success');
        
        // Redirect to appropriate dashboard
        const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent';
        navigate(dashboardPath);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <nav className="text-sm text-gray-600">
            <span>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Create New Loop</span>
          </nav>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Transaction Loop</h1>
          <p className="text-gray-600 mt-2">
            Start a new real estate transaction by filling out the details below. 
            All fields marked with * are required.
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fill in the transaction type and property details</li>
                <li>• Add client information for communication</li>
                <li>• Set target dates to track progress</li>
                <li>• Use tags to categorize and organize your loops</li>
                <li>• Add notes for important details or reminders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <LoopForm
        onSubmit={handleSubmit}
        loading={loading}
        isEdit={false}
      />

      {/* Help Section */}
      <div className="mt-8 card">
        <div className="card-body">
          <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Transaction Types</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• <strong>Purchase:</strong> Buyer acquiring property</li>
                <li>• <strong>Sale:</strong> Seller listing property</li>
                <li>• <strong>Lease:</strong> Rental agreements</li>
                <li>• <strong>Refinance:</strong> Loan refinancing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status Meanings</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• <strong>Active:</strong> Transaction in progress</li>
                <li>• <strong>Closing:</strong> Near completion</li>
                <li>• <strong>Closed:</strong> Successfully completed</li>
                <li>• <strong>Cancelled:</strong> Transaction terminated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLoop;
